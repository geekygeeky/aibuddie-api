import crypto from "node:crypto";
import { BASE62 } from "./constants";

function randomBase62(bytes = 16) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);

  let out = "";
  for (const b of buffer) {
    out += BASE62[b % 62];
  }
  return out;
}

export function generateId(prefix: string) {
  return `${prefix.toUpperCase()}_${randomBase62(16)}`;
}
