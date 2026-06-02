import { useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "../lib/cn.ts";

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="border-t border-border bg-bg/80 py-3 backdrop-blur">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-panel/70 px-3 py-1.5 backdrop-blur-md transition-colors focus-within:border-accent/60">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ask Paul Graham…"
          className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={busy ? onStop : onSubmit}
          disabled={!busy && !value.trim()}
          aria-label={busy ? "Stop" : "Send"}
          className={cn(
            "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all active:scale-95",
            busy
              ? "bg-panel-2 text-text hover:bg-border"
              : "bg-accent text-white disabled:opacity-40",
          )}
        >
          {busy ? <Square size={14} fill="currentColor" /> : <ArrowUp size={18} />}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
