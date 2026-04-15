import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string;
  variation?: string;
  up?: boolean;
  isLoading?: boolean;
}
export function StatCard({ label, value, variation, up, isLoading }: StatCardProps) {
  return <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
      <CardContent className="p-4">
        <p className="font-semibold text-[#454545] text-xs">{label}</p>
        {isLoading
          ? <Skeleton className="h-5 w-20 mt-1" />
          : <p className="font-semibold text-[#F58320] text-left text-base">{value}</p>
        }
      </CardContent>
    </Card>;
}