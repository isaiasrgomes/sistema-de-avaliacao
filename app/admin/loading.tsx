export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-xl border border-border/60 bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
      <div className="h-40 rounded-xl border border-border/60 bg-muted/40" />
    </div>
  );
}
