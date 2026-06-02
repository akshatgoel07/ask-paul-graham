import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { PersonaHeader } from "./components/PersonaHeader.tsx";
import { Composer } from "./components/Composer.tsx";
import { Message, type ChatMessage } from "./components/Message.tsx";
import { streamChat } from "./api.ts";

const SUGGESTIONS = [
  "What are superlinear returns?",
  "How do I get new ideas?",
  "Why does writing matter?",
  "What have you learned from startup users?",
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    setMessages((m) => [
      ...m,
      { role: "user", content: q },
      { role: "assistant", content: "" },
    ]);

    const patchLast = (fn: (msg: ChatMessage) => ChatMessage) =>
      setMessages((m) => {
        const next = m.slice();
        const i = next.length - 1;
        if (i >= 0 && next[i]!.role === "assistant") next[i] = fn(next[i]!);
        return next;
      });

    try {
      for await (const ev of streamChat(q, ac.signal)) {
        if (ev.type === "token") {
          patchLast((msg) => ({ ...msg, content: msg.content + ev.value }));
        } else if (ev.type === "citations") {
          patchLast((msg) => ({ ...msg, citations: ev.citations }));
        } else if (ev.type === "cache") {
          patchLast((msg) => ({ ...msg, cache: ev.hit }));
        } else if (ev.type === "error") {
          toast.error(ev.message);
        }
      }
    } catch (err) {
      if (!ac.signal.aborted) {
        toast.error(
          err instanceof Error ? err.message : "Could not reach the API",
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setBusy(false);
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4">
      <PersonaHeader />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto py-5">
        {empty ? (
          <div className="m-auto w-full max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <h2 className="font-serif text-[26px] leading-tight">
                Ask me anything.
              </h2>
              <p className="mt-2 text-sm text-muted">
                I'll answer from my essays, in my own words — with citations.
              </p>
            </motion.div>

            <div className="mt-6 flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: 0.1 + i * 0.05,
                    ease: "easeOut",
                  }}
                  onClick={() => ask(s)}
                  className="rounded-xl border border-border bg-panel/60 px-4 py-3 text-left text-[15px] backdrop-blur-md transition-colors hover:border-accent/60"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <Message
                key={i}
                m={m}
                streaming={
                  busy && i === messages.length - 1 && m.role === "assistant"
                }
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={endRef} />
      </main>

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => ask(input)}
        onStop={stop}
        busy={busy}
      />
    </div>
  );
}
