export default function TripLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded" />
            <div className="h-6 w-36 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded ml-11" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-full" />
      </div>
      <div className="flex border-b gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-t" />
        ))}
      </div>
      <div className="space-y-3 pt-2">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
