import { motion } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@pg/shared";
import { cn } from "../lib/cn.ts";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  cache?: "semantic" | "response" | "miss";
}

function AssistantProse({ text }: { text: string }) {
  return (
    <div
      className={cn(
        "font-serif text-[17px] leading-relaxed text-text/95",
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold [&_strong]:text-text",
        "[&_em]:italic",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1",
        "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2",
        "[&_h1]:mb-2 [&_h1]:text-xl [&_h2]:mb-2 [&_h2]:text-lg [&_h3]:mb-1 [&_h3]:text-base",
        "[&_code]:rounded [&_code]:bg-panel-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-sans [&_code]:text-[14px]",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted",
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  );
}

export function Message({
  m,
  streaming = false,
}: {
  m: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = m.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3",
          isUser
            ? "border border-border bg-panel-2"
            : "border border-border bg-panel/70 backdrop-blur-md",
        )}
      >
        {m.cache && m.cache !== "miss" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mb-2 inline-block rounded-md border border-accent/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent"
          >
            {m.cache} cache
          </motion.span>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
        ) : (
          <>
            <AssistantProse text={m.content} />
            {streaming && (
              <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse rounded-full bg-accent align-middle" />
            )}
          </>
        )}

        {m.citations && m.citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-border pt-2.5">
            {m.citations.map((c) => (
              <a
                key={c.chunkId}
                href={c.link}
                target="_blank"
                rel="noreferrer"
                title={`relevance ${c.score.toFixed(3)}`}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-text"
              >
                {c.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
