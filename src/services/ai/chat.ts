import { AIRouter, ModelTier } from "./router";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "#/db";
import { id } from "@instantdb/admin";
import { DodoPaymentsService } from "../billing/dodo";

interface ChatRequest {
  userId: string;
  conversationId: string;
  buddyId: string;
  buddyPrompt: string;
  userMessage: string;
  forceTier?: ModelTier;
}

export class ChatService {
  private router: AIRouter;
  private dodoService: DodoPaymentsService;

  constructor() {
    this.router = new AIRouter();
    this.dodoService = new DodoPaymentsService();
  }

  async processChat(request: ChatRequest) {
    const {
      userId,
      conversationId,
      buddyId,
      buddyPrompt,
      userMessage,
      forceTier,
    } = request;

    const userResult = await db.query({
      profiles: {
        $: {
          where: {
            id: userId,
          },
        },
      },
    });

    const profile = userResult.profiles[0];
    if (!profile) throw new Error("User not found");
    // const profile = user.profile;

    const tier =
      forceTier || (await this.router.routeRequest(userMessage)).tier;
    const { model, cost } = this.router.getModelForTier(tier, buddyPrompt);

    let creditsToUse = cost;
    let overageCharged = false;

    if (profile.credits < cost) {
      if (!profile.dodoCustomerId) {
        throw new Error(
          "Insufficient credits. Please upgrade your plan or add a payment method.",
        );
      }

      overageCharged = true;
      await this.dodoService.chargeOverage(userId, cost);
    }

    const chatMessages = [
      new SystemMessage(buddyPrompt),
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(chatMessages);
    const assistantMessage = response.content.toString();

    const userMessageId = id();
    const assistantMessageId = id();
    const usageHistoryId = id();

    const newCredits = overageCharged
      ? profile.credits
      : profile.credits - cost;

    await db.transact([
      db.tx.messages[userMessageId]
        .update({
          role: "user",
          content: userMessage,
          modelUsed: tier,
          tokensUsed: 0,
          creditsCharged: 0,
          createdAt: Date.now(),
        })
        .link({ conversation: conversationId }),

      db.tx.messages[assistantMessageId]
        .update({
          role: "assistant",
          content: assistantMessage,
          modelUsed: tier,
          tokensUsed: 0,
          creditsCharged: cost,
          createdAt: Date.now(),
        })
        .link({ conversation: conversationId }),

      db.tx.profiles[profile.id].update({
        credits: newCredits,
        updatedAt: Date.now(),
      }),

      db.tx.usageHistory[usageHistoryId]
        .update({
          action: "chat",
          creditsUsed: cost,
          metadata: { tier, messageLength: userMessage.length, overageCharged },
          createdAt: Date.now(),
        })
        .link({ user: userId, buddy: buddyId }),

      db.tx.conversations[conversationId].update({
        updatedAt: Date.now(),
      }),
    ]);

    const buddyResult = await db.query({
      buddies: {
        $: {
          where: {
            id: buddyId,
          },
        },
      },
    });

    const buddy = buddyResult.buddies[0];

    await db.transact(
      db.tx.buddies[buddyId].update({
        usageCount: buddy.usageCount + 1,
      }),
    );

    return {
      message: assistantMessage,
      tier,
      creditsUsed: cost,
      creditsRemaining: newCredits,
      overageCharged,
    };
  }
}
