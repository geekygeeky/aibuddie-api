import { Elysia, t } from "elysia";
import { ChatService } from "#/services/ai/chat";
import { db } from "#/db";
import { randomUUIDv7 } from "bun";

const chatService = new ChatService();

export const chatRoutes = new Elysia({ prefix: "/api/chat" })
  .derive(async ({ headers }) => {
    const auth = headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = auth.substring(7);
    const user = await db.auth.verifyToken(token);

    if (!user) {
      throw new Error("Uh oh, you are not authenticated");
    }

    const result = await db.query({
      profiles: {
        $: {
          where: {
            id: user.id,
          },
        },
      },
    });

    const profile = result.profiles?.at(0);
    console.log('profile', profile, user)

    if (!profile) {
      throw new Error("User not found");
    }

    return { user, profile };
  })
  //   .use(authenticateUser)
  .post(
    "/message",
    async ({ body, user }) => {
      const { conversationId, message, forceTier } = body;

      const conversationResult = await db.query({
        conversations: {
          $: {
            where: {
              id: conversationId,
            },
          },
          user: {},
          buddy: { creator: {} },
        },
      });

      const conversation = conversationResult.conversations[0];

      if (!conversation || conversation.user?.id !== user.id) {
        throw new Error("Conversation not found");
      }

      const buddy = conversation.buddy;
      if (!buddy) throw new Error("Buddy not found");

      if (!buddy.isActive) {
        throw new Error("This buddy is no longer active");
      }

      if (!buddy.isPublic && buddy.creator?.id !== user.id) {
        throw new Error("This buddy is private");
      }

      const result = await chatService.processChat({
        userId: user.id,
        conversationId,
        buddyId: buddy.id,
        buddyPrompt: buddy.systemPrompt,
        userMessage: message,
        forceTier,
      });

      return result;
    },
    {
      body: t.Object({
        conversationId: t.String(),
        message: t.String(),
        forceTier: t.Optional(
          t.Union([t.Literal("low"), t.Literal("medium"), t.Literal("high")]),
        ),
      }),
    },
  )
  .post(
    "/conversation/new",
    async ({ body, user }) => {
      const { buddyId } = body;

      const buddyResult = await db.query({
        buddies: {
          $: {
            where: {
              id: buddyId,
            },
          },
          creator: {},
        },
      });

      const buddy = buddyResult.buddies[0];
      if (!buddy) throw new Error("Buddy not found");

      if (!buddy.isActive) {
        throw new Error("This buddy is no longer active");
      }

      if (!buddy.isPublic && buddy.creator?.id !== user.id) {
        throw new Error("Cannot start conversation with private buddy");
      }

      const conversationId = randomUUIDv7();

      await db.transact(
        db.tx.conversations[conversationId]
          .update({
            title: `New ${buddy.name} Chat`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          .link({ user: user.id, buddy: buddyId }),
      );

      return {
        id: conversationId,
        profileId: user.id,
        buddyId,
        title: `New ${buddy.name} Chat`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },
    {
      body: t.Object({
        buddyId: t.String(),
      }),
    },
  )
  .get("/conversations", async ({ user, profile }) => {
    const result = await db.query({
      conversations: {
        $: {
          where: {
            "user.id": user.id,
          },
        },
        buddy: {},
      },
    });

    return result.conversations;
    // return result.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  })
  .get("/conversation/:id/messages", async ({ params, user }) => {
    const conversationResult = await db.query({
      conversations: {
        $: {
          where: {
            id: params.id,
          },
        },
        user: {},
        messages: {},
      },
    });

    const conversation = conversationResult.conversations[0];

    if (!conversation || conversation.user?.id !== user.id) {
      throw new Error("Conversation not found");
    }

    return conversation.messages;
    // return conversation.messages.sort((a, b) => a.createdAt - b.createdAt);
  });
