import { env } from "bun";

export const isProduction = (env.NODE_ENV ?? env.BUN_ENV) === "production";

export const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const PREFIXES = {
  usage: "usg",
  buddy: "bug",
} as const;
