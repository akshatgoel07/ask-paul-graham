import { createHash } from "node:crypto";

/** Hex sha256 — used as embedding-cache keys and response-cache keys. */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Deterministic UUID-shaped id derived from a string. Qdrant point ids must be
 * an unsigned int or a UUID, so we map arbitrary keys (e.g. a normalized query)
 * onto a stable UUID for idempotent upserts.
 */
export function hashToUuid(input: string): string {
  const h = createHash("sha256").update(input).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join("-");
}
