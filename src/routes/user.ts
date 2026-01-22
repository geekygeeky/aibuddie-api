import { password, randomUUIDv7 } from "bun";
import { Elysia, t } from "elysia";
import { db } from "#/db";

export const userRoutes = new Elysia({ prefix: "/api/user" })
  .derive(async ({ headers }) => {
    const auth = headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = auth.substring(7);
    const user = await db.auth.verifyToken(token);

    console.log("user", user);

    if (!user) {
      throw new Error("Uh oh, you are not authenticated");
    }

    return { user };
  })
  .get("/me", async ({ user }) => {
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

    if (!profile) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: profile.name,
      credits: profile.credits,
      subscriptionTier: profile.subscriptionTier,
    };
  })
  .get("/stats", async ({ user }) => {
    const userUsageResult = await db.query({
      usageHistory: {
        $: {
          where: {
            "user.id": user.id,
          },
        },
      },
    });

    const userUsageByDate = userUsageResult.usageHistory.reduce(
      (acc, record) => {
        const date = new Date(record.createdAt).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += record.creditsUsed;
        return acc;
      },
      {} as Record<string, number>,
    );

    const userUsage = Object.entries(userUsageByDate)
      .map(([date, credits]) => ({ date, credits }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    return {
      userUsage,
    };
  });
