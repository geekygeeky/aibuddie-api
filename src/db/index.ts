import { init } from "@instantdb/admin";
import schema from "./instant.schema";


const db = init({
  appId: process.env.INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
  schema,
});

export { db };
