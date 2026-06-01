import {
  embedDocuments,
  getCachedEmbedding,
  setCachedEmbedding,
  sha256,
} from "@pg/core";

const EMBED_BATCH = 64;

/**
 * Embed texts, serving from the Redis embedding cache where possible and only
 * calling Gemini for cache misses. Returns vectors aligned to the input order.
 */
export async function embedWithCache(texts: string[]): Promise<number[][]> {
  const hashes = texts.map(sha256);
  const results: (number[] | null)[] = await Promise.all(
    hashes.map((h) => getCachedEmbedding(h)),
  );

  const missing = results
    .map((vec, i) => (vec ? -1 : i))
    .filter((i) => i >= 0);

  for (let i = 0; i < missing.length; i += EMBED_BATCH) {
    const idxBatch = missing.slice(i, i + EMBED_BATCH);
    const fresh = await embedDocuments(idxBatch.map((idx) => texts[idx]!));
    await Promise.all(
      idxBatch.map((idx, k) => {
        const vec = fresh[k]!;
        results[idx] = vec;
        return setCachedEmbedding(hashes[idx]!, vec);
      }),
    );
  }

  return results.map((vec, i) => {
    if (!vec) throw new Error(`Missing embedding for chunk ${i}`);
    return vec;
  });
}
