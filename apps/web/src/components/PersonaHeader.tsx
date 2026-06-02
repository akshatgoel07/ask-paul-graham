export function PersonaHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-border px-1 py-4">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 font-serif text-[15px] font-semibold text-accent">
        pg
      </div>
      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold leading-tight">Paul Graham</h1>
        <p className="truncate text-xs text-muted">
          Essayist · Y Combinator — grounded in his essays
        </p>
      </div>
    </header>
  );
}
