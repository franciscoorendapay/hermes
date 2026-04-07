import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressCardProps {
  title: string;
  progress: number;
  progressLabel: string;
  goal: number;
  goalLabel: string;
  formatValue?: (value: number) => string;
  isLoading?: boolean;
}
export function ProgressCard({
  title,
  progress,
  progressLabel,
  goal,
  goalLabel,
  formatValue = v => String(v),
  isLoading,
}: ProgressCardProps) {
  const percentage = Math.min(progress / (goal || 1) * 100, 100);
  return <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-[#2A2A2A] mb-4">{title}</h3>

        <div className="flex justify-between mb-2">
          <div>
            <p className="text-xs font-normal text-[#737373]">{progressLabel}</p>
            {isLoading ? <Skeleton className="h-5 w-20 mt-1" /> : <p className="text-base font-bold text-[#454545]">{formatValue(progress)}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-normal text-[#737373]">{goalLabel}</p>
            {isLoading ? <Skeleton className="h-5 w-16 mt-1 ml-auto" /> : <p className="font-bold text-[#454545] text-base">{formatValue(goal)}</p>}
          </div>
        </div>

        {isLoading
          ? <Skeleton className="h-5 w-full rounded-full" />
          : <div className="h-5 w-full bg-[#E5E5E5] rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
        }
      </CardContent>
    </Card>;
}