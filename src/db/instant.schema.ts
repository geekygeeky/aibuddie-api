// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/admin";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
      password: i.string().optional(),
      imageURL: i.string().optional(),
      role: i.string().optional(),
      emailVerifiedAt: i.date().optional(),
    }),
    profiles: i.entity({
      name: i.string(),
      credits: i.number(),
      monthlyCredits: i.number(),
      creditsResetDate: i.number(),
      subscriptionTier: i.string(),
      dodoCustomerId: i.string().optional(),
      dodoSubscriptionId: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    buddies: i.entity({
      slug: i.string().unique().indexed(),
      name: i.string(),
      description: i.string(),
      category: i.string().indexed(),
      icon: i.string(),
      systemPrompt: i.string(),
      modelTier: i.string(),
      isActive: i.boolean(),
      isPublic: i.boolean(),
      usageCount: i.number(),
      createdAt: i.date(),
    }),
    conversations: i.entity({
      title: i.string(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    messages: i.entity({
      role: i.string(),
      content: i.string(),
      modelUsed: i.string().optional(),
      tokensUsed: i.number().optional(),
      creditsCharged: i.number().optional(),
      createdAt: i.date(),
    }),
    usageHistory: i.entity({
      action: i.string(),
      creditsUsed: i.number(),
      metadata: i.json().optional(),
      createdAt: i.date(),
    }),
    billingRecords: i.entity({
      credits: i.number(),
      amount: i.number(),
      dodoPaymentId: i.string().optional(),
      status: i.string(),
      type: i.string(),
      createdAt: i.date(),
    }),
    apiKeys: i.entity({
      key: i.string().unique().indexed(),
      name: i.string(),
      isActive: i.boolean(),
      lastUsed: i.number().optional(),
      createdAt: i.date(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    userProfile: {
      forward: {
        on: "profiles",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "one",
        label: "profile",
      },
    },
    userConversations: {
      forward: {
        on: "conversations",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "conversations",
      },
    },
    conversationBuddy: {
      forward: {
        on: "conversations",
        has: "one",
        label: "buddy",
      },
      reverse: {
        on: "buddies",
        has: "many",
        label: "conversations",
      },
    },
    conversationMessages: {
      forward: {
        on: "messages",
        has: "one",
        label: "conversation",
      },
      reverse: {
        on: "conversations",
        has: "many",
        label: "messages",
      },
    },
    userUsageHistory: {
      forward: {
        on: "usageHistory",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "usageHistory",
      },
    },
    buddyUsageHistory: {
      forward: {
        on: "usageHistory",
        has: "one",
        label: "buddy",
      },
      reverse: {
        on: "buddies",
        has: "many",
        label: "usageHistory",
      },
    },
    userBillingRecords: {
      forward: {
        on: "billingRecords",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "billingRecords",
      },
    },
    buddyCreator: {
      forward: {
        on: "buddies",
        has: "one",
        label: "creator",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "createdBuddies",
      },
    },
    userApiKeys: {
      forward: {
        on: "apiKeys",
        has: "one",
        label: "user",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "apiKeys",
      },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
