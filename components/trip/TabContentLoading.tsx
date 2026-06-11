import { Spinner } from "@/components/ui/loading";

export function TabContentLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
