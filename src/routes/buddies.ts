import { randomUUIDv7 } from "bun";
import { Elysia, t } from "elysia";
import { db } from "#/db";

const generateUniqueSlug = (baseSlug: string, length: number = 6): string => {
  const randomPart = Array.from(
    { length },
    () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
  ).join("");
  return `${baseSlug}-${randomPart}`;
};

const createUniqueSlug = async (
  name: string,
  slugLength: number = 6,
): Promise<string> => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const slug = generateUniqueSlug(baseSlug, slugLength);

    const existing = await db.query({
      buddies: {
        $: {
          where: {
            slug,
          },
        },
      },
    });

    if (existing.buddies.length === 0) {
      return slug;
    }

    attempts++;
    slugLength++;
  }

  throw new Error("Failed to generate unique slug");
};

const parseDate = (date: string | number) => new Date(date).getTime();

export const buddyRoutes = new Elysia({ prefix: "/api/buddies" })
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
      $users: {
        $: {
          where: {
            id: user.id,
          },
        },
        profile: {},
      },
    });

    const profile = result.$users?.at(0);

    if (!profile) {
      throw new Error("User not found");
    }

    return { user: profile };
  })
  .get("/", async () => {
    const result = await db.query({
      buddies: {
        $: {
          where: {
            isPublic: true,
            isActive: true,
          },
        },
      },
    });

    return result.buddies.sort((a, b) => b.usageCount - a.usageCount);
  })
  .get("/:slug", async ({ params, user }) => {
    console.log(user);
    const result = await db.query({
      buddies: {
        $: {
          where: {
            slug: params.slug,
          },
        },
      },
    });

    const buddy = result.buddies[0];
    if (!buddy) throw new Error("Buddy not found");

    return buddy;
  })
  .get("/category/:category", async ({ params }) => {
    const result = await db.query({
      buddies: {
        $: {
          where: {
            category: params.category,
            isActive: true,
            isPublic: true,
          },
        },
      },
    });

    return result.buddies;
  })
  .get("/my/buddies", async ({ user }) => {
    const result = await db.query({
      buddies: {
        $: {
          where: {
            "creator.id": user.id,
          },
        },
      },
    });

    return result.buddies.sort(
      (a, b) => parseDate(b.createdAt) - parseDate(a.createdAt),
    );
  })
  .post(
    "/create",
    async ({ body, user }) => {
      const {
        name,
        description,
        category,
        icon,
        systemPrompt,
        modelTier,
        isPublic,
        slugLength,
      } = body;

      const slug = await createUniqueSlug(name, slugLength ?? 6);

      const buddyId = randomUUIDv7();

      await db.transact(
        db.tx.buddies[buddyId]
          .update({
            slug,
            name,
            description,
            category,
            icon,
            systemPrompt,
            modelTier,
            isActive: true,
            isPublic: isPublic ?? false,
            usageCount: 0,
            createdAt: Date.now(),
          })
          .link({ creator: user.id }),
      );

      return {
        id: buddyId,
        slug,
        name,
        message: "Buddy created successfully",
      };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        category: t.String(),
        icon: t.String(),
        systemPrompt: t.String(),
        modelTier: t.Union([
          t.Literal("low"),
          t.Literal("medium"),
          t.Literal("high"),
        ]),
        isPublic: t.Optional(t.Boolean()),
        slugLength: t.Optional(t.Number({ minimum: 6 })),
      }),
    },
  )
  .patch(
    "/update/:id",
    async ({ params, body, user }) => {
      const buddyResult = await db.query({
        buddies: {
          $: {
            where: {
              id: params.id,
            },
          },
          creator: {},
        },
      });

      const buddy = buddyResult.buddies[0];
      if (!buddy) throw new Error("Buddy not found");

      if (
        buddy.creator?.id !== user.id &&
        user.role !== "admin" &&
        user.role !== "super-admin"
      ) {
        throw new Error("Unauthorized");
      }

      const updateData: any = { ...body };

      if (body.name && body.name !== buddy.name) {
        updateData.slug = await createUniqueSlug(
          body.name,
          body.slugLength ?? 6,
        );
      }

      await db.transact(db.tx.buddies[params.id].update(updateData));

      return {
        message: "Buddy updated successfully",
        slug: updateData.slug || buddy.slug,
      };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        systemPrompt: t.Optional(t.String()),
        isPublic: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        slugLength: t.Optional(t.Number({ minimum: 6 })),
      }),
    },
  )
  .delete("/:id", async ({ params, user }) => {
    const buddyResult = await db.query({
      buddies: {
        $: {
          where: {
            id: params.id,
          },
        },
        creator: {},
      },
    });

    const buddy = buddyResult.buddies[0];
    if (!buddy) throw new Error("Buddy not found");

    if (
      buddy.creator?.id !== user.id &&
      user.role !== "admin" &&
      user.role !== "super-admin"
    ) {
      throw new Error("Unauthorized");
    }

    await db.transact(
      db.tx.buddies[params.id].update({
        isActive: false,
      }),
    );

    return { message: "Buddy deleted successfully" };
  });
