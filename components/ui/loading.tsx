export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-sky-200 border-t-sky-500 ${className ?? "h-5 w-5"}`}
    />
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-100 border-t-sky-400" />
    </div>
  );
}
