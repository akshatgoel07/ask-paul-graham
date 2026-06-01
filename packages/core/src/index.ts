export { getConfig } from "./config.ts";
export type { Config } from "./config.ts";

export { sha256, hashToUuid } from "./util/hash.ts";

export { embedDocuments, embedQuery, generateStream } from "./clients/gemini.ts";

export {
  qdrant,
  ensureCollection,
  upsertChunks,
  deleteEssayPoints,
  searchChunks,
} from "./clients/qdrant.ts";
export type { ChunkPayload, ScoredChunk } from "./clients/qdrant.ts";

export { redis } from "./clients/redis.ts";

export {
  getCachedEmbedding,
  setCachedEmbedding,
  getCachedRetrieval,
  setCachedRetrieval,
  getCachedResponse,
  setCachedResponse,
  ensureSemanticCache,
  getSemanticAnswer,
  setSemanticAnswer,
} from "./cache.ts";
export type { SemanticHit } from "./cache.ts";

export { retrieve } from "./retrieval.ts";
