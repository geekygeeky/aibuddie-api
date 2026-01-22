import { Elysia } from "elysia";
import { db } from "#/db";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
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

    const userResult = await db.query({
      $users: {
        $: {
          where: {
            id: user.id,
          },
        },
      },
    });

    // check isadmin
    const roles = ["super-admin", "admin"];
    const role = userResult.$users.at(0)?.role;
    if (!role || !roles.includes(role)) {
      throw new Error("Uh oh, you are not authenticated");
    }

    return { user: userResult.$users[0] };
  })
  .get("/stats", async ({ user }) => {
    const usersResult = await db.query({ $users: {} });

    const usageResult = await db.query({
      usageHistory: {
        user: {},
      },
    });

    const buddiesResult = await db.query({ buddies: {} });

    const userUsageResult = await db.query({
      usageHistory: {
        $: {
          where: {
            "user.id": user.id,
          },
        },
      },
    });

    const totalCreditsUsed = usageResult.usageHistory.reduce(
      (sum, record) => sum + record.creditsUsed,
      0,
    );

    const topBuddies = buddiesResult.buddies
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((buddy) => ({
        id: buddy.id,
        name: buddy.name,
        usageCount: buddy.usageCount,
      }));

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
      totalUsers: usersResult.$users.length,
      totalCreditsUsed,
      topBuddies,
      userUsage,
    };
  });
