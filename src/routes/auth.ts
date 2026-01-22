import { password, randomUUIDv7 } from "bun";
import { Elysia, t } from "elysia";
import { db } from "#/db";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post(
    "/register",
    async ({ body }) => {
      const { name } = body;

      const email = body.email.toLowerCase();

      const existingUsers = await db.query({
        $users: {
          $: {
            where: {
              email,
            },
          },
        },
      });

      if (existingUsers.$users.length) {
        throw new Error("Email already registered");
      }

      const passwordHash = await password.hash(body.password);
      const userId = randomUUIDv7();
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1);

      await db.transact([
        db.tx.$users[userId].update({
          email,
          password: passwordHash,
          role: "user",
        }),
        db.tx.profiles[userId]
          .update({
            name,
            credits: 1000,
            monthlyCredits: 1000,
            creditsResetDate: resetDate.getTime(),
            subscriptionTier: "free",
            dodoCustomerId: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          .link({ user: userId }),
      ]);

      const token = await db.auth.createToken({ email });

      return {
        token,
        user: {
          id: userId,
          email,
          name,
          credits: 1000,
          subscriptionTier: "free",
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        name: t.String(),
      }),
    },
  )
  .post(
    "/login",
    async ({ body }) => {
      const { email } = body;

      const result = await db.query({
        $users: {
          $: {
            where: {
              email,
            },
          },
          profile: {},
        },
      });

      const user = result.$users[0];

      if (!user.password) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await password.verify(
        body.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const token = await db.auth.createToken({ email });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name,
          credits: user.profile?.credits || 0,
          subscriptionTier: user.profile?.subscriptionTier,
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  );
