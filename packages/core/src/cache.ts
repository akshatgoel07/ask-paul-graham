import type { Citation } from "@pg/shared";
import { getConfig } from "./config.ts";
import { qdrant } from "./clients/qdrant.ts";
import { redis } from "./clients/redis.ts";
import { hashToUuid } from "./util/hash.ts";

const TTL_RETRIEVAL = 60 * 10; // 10 min
const TTL_RESPONSE = 60 * 60 * 24; // 24 h
const SEMANTIC_COLLECTION = "semantic_cache";

function embKey(hash: string): string {
  const cfg = getConfig();
  return `emb:${cfg.EMBEDDING_MODEL}:${cfg.EMBEDDING_DIM}:${hash}`;
}

// --- Embedding cache (Redis) -------------------------------------------------

export async function getCachedEmbedding(
  contentHash: string,
): Promise<number[] | null> {
  const raw = await redis().get(embKey(contentHash));
  return raw ? (JSON.parse(raw) as number[]) : null;
}

export async function setCachedEmbedding(
  contentHash: string,
  vector: number[],
): Promise<void> {
  await redis().set(embKey(contentHash), JSON.stringify(vector));
}

// --- Retrieval cache (Redis) -------------------------------------------------

export async function getCachedRetrieval<T>(queryHash: string): Promise<T | null> {
  const raw = await redis().get(`retr:${queryHash}`);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setCachedRetrieval(
  queryHash: string,
  value: unknown,
): Promise<void> {
  await redis().set(`retr:${queryHash}`, JSON.stringify(value), "EX", TTL_RETRIEVAL);
}

// --- Exact response cache (Redis) -------------------------------------------

export async function getCachedResponse(promptHash: string): Promise<string | null> {
  return redis().get(`resp:${promptHash}`);
}

export async function setCachedResponse(
  promptHash: string,
  answer: string,
): Promise<void> {
  await redis().set(`resp:${promptHash}`, answer, "EX", TTL_RESPONSE);
}

// --- Semantic answer cache (Qdrant) -----------------------------------------

export async function ensureSemanticCache(): Promise<void> {
  const cfg = getConfig();
  const { exists } = await qdrant().collectionExists(SEMANTIC_COLLECTION);
  if (!exists) {
    await qdrant().createCollection(SEMANTIC_COLLECTION, {
      vectors: { size: cfg.EMBEDDING_DIM, distance: "Cosine" },
    });
  }
}

export interface SemanticHit {
  answer: string;
  citations: Citation[];
  query: string;
  score: number;
}

/** Return a cached answer if a prior query is semantically close enough. */
export async function getSemanticAnswer(
  queryVector: number[],
): Promise<SemanticHit | null> {
  const cfg = getConfig();
  const res = await qdrant().search(SEMANTIC_COLLECTION, {
    vector: queryVector,
    limit: 1,
    with_payload: true,
  });
  const top = res[0];
  if (top && top.score >= cfg.SEMANTIC_CACHE_THRESHOLD) {
    const p = top.payload as unknown as {
      answer: string;
      citations?: Citation[];
      query: string;
    };
    return {
      answer: p.answer,
      citations: p.citations ?? [],
      query: p.query,
      score: top.score,
    };
  }
  return null;
}

export async function setSemanticAnswer(
  query: string,
  queryVector: number[],
  answer: string,
  citations: Citation[],
): Promise<void> {
  await qdrant().upsert(SEMANTIC_COLLECTION, {
    wait: true,
    points: [
      { id: hashToUuid(query), vector: queryVector, payload: { query, answer, citations } },
    ],
  });
}
