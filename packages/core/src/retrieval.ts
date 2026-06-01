import type { RetrievedChunk } from "@pg/shared";
import { getConfig } from "./config.ts";
import { embedQuery } from "./clients/gemini.ts";
import { searchChunks } from "./clients/qdrant.ts";

/**
 * Embed a query and pull the top-k chunks from Qdrant. Returns the query vector
 * too so callers can reuse it for the semantic cache without re-embedding.
 */
export async function retrieve(
  query: string,
): Promise<{ vector: number[]; chunks: RetrievedChunk[] }> {
  const cfg = getConfig();
  const vector = await embedQuery(query);
  const hits = await searchChunks(vector, cfg.RETRIEVE_TOP_K);
  const chunks: RetrievedChunk[] = hits.map((h) => ({
    chunkId: h.payload.chunkId,
    essayId: h.payload.essayId,
    title: h.payload.title,
    link: h.payload.link,
    text: h.payload.text,
    score: h.score,
  }));
  return { vector, chunks };
}
