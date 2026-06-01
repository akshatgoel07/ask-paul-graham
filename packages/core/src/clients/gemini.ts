import { GoogleGenAI } from "@google/genai";
import { getConfig } from "../config.ts";

let client: GoogleGenAI | undefined;

function genai(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: getConfig().GEMINI_API_KEY });
  }
  return client;
}

function l2normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

/**
 * Embed a batch of texts. `taskType` makes retrieval asymmetric — documents and
 * queries are embedded into the same space but with task-appropriate weighting.
 * gemini-embedding-001 needs L2 normalization when the dimensionality is
 * truncated below 3072, so we normalize unconditionally (safe for cosine).
 */
async function embed(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { EMBEDDING_MODEL, EMBEDDING_DIM } = getConfig();
  const res = await genai().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBEDDING_DIM, taskType },
  });
  const embeddings = res.embeddings ?? [];
  return embeddings.map((e) => l2normalize(e.values ?? []));
}

export function embedDocuments(texts: string[]): Promise<number[][]> {
  return embed(texts, "RETRIEVAL_DOCUMENT");
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embed([text], "RETRIEVAL_QUERY");
  if (!vec) throw new Error("Gemini returned no embedding for the query");
  return vec;
}

/** Stream a generation as text deltas. */
export async function* generateStream(opts: {
  system: string;
  prompt: string;
  temperature?: number;
}): AsyncGenerator<string> {
  const { GENERATION_MODEL } = getConfig();
  const stream = await genai().models.generateContentStream({
    model: GENERATION_MODEL,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.7,
    },
  });
  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
