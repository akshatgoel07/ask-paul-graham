import { getConfig } from "@pg/core";

/** Rough English-prose heuristic; good enough for sizing without a tokenizer. */
const CHARS_PER_TOKEN = 4;

export interface TextChunk {
  index: number;
  text: string;
  tokens: number;
}

/**
 * Split cleaned text into overlapping windows sized by an approximate token
 * budget. Splits on paragraph boundaries first, hard-splitting any paragraph
 * that exceeds the window on its own.
 */
export function chunkText(text: string): TextChunk[] {
  const cfg = getConfig();
  const maxChars = Math.max(400, cfg.CHUNK_TOKENS * CHARS_PER_TOKEN);
  const overlapChars = Math.min(
    cfg.CHUNK_OVERLAP * CHARS_PER_TOKEN,
    Math.floor(maxChars / 2),
  );

  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: TextChunk[] = [];
  let buf = "";
  let dirty = false;

  const push = () => {
    const t = buf.trim();
    if (!t) return;
    chunks.push({
      index: chunks.length,
      text: t,
      tokens: Math.ceil(t.length / CHARS_PER_TOKEN),
    });
  };

  for (const p of paragraphs) {
    const candidate = buf ? `${buf}\n${p}` : p;
    if (candidate.length > maxChars && buf) {
      push();
      buf = overlapChars > 0 ? `${buf.slice(-overlapChars)}\n${p}` : p;
    } else {
      buf = candidate;
    }
    dirty = true;

    // Hard-split a paragraph longer than the whole window.
    while (buf.length > maxChars) {
      const head = buf.slice(0, maxChars);
      chunks.push({
        index: chunks.length,
        text: head.trim(),
        tokens: Math.ceil(head.length / CHARS_PER_TOKEN),
      });
      buf =
        overlapChars > 0
          ? buf.slice(maxChars - overlapChars)
          : buf.slice(maxChars);
    }
  }

  if (dirty) push();
  return chunks;
}
