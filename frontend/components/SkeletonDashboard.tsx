function Block({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface ${
        tall ? "h-32" : "h-24"
      }`}
    />
  );
}

export default function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Block tall />
        <Block tall />
        <Block tall />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Block />
        <Block />
        <Block />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
    </div>
  );
}
