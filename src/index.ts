import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { buddyRoutes } from "./routes/buddies";
import { userRoutes } from "./routes/user";
import { chatRoutes } from "./routes/chat";
import { adminRoutes } from "./routes/admin";

declare module "bun" {
  interface Env {
    INSTANT_APP_ID: string;
    INSTANT_ADMIN_TOKEN: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
  }
}

const origins = ["http://localhost:5173", "http://localhost:4173"];

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || origins,
      credentials: true,
    }),
  )
  .get("/", () => "Hello AIBuddie")
  .use(authRoutes)
  .use(userRoutes)
  .use(buddyRoutes)
  .use(chatRoutes)
  .use(adminRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
