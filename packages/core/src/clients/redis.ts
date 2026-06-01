import Redis from "ioredis";
import { getConfig } from "../config.ts";

let client: Redis | undefined;

export function redis(): Redis {
  if (!client) {
    client = new Redis(getConfig().REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }
  return client;
}
