import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  height?: number;
}

export const ChartSkeleton = ({ height = 300 }: ChartSkeletonProps) => {
  return (
    <div className="w-full animate-fade-in" style={{ height }}>
      <Skeleton className="h-full w-full" />
    </div>
  );
};
