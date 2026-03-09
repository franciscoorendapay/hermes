import { Card, CardContent } from "@/components/ui/card";
interface StatCardProps {
  label: string;
  value: string;
  variation?: string;
  up?: boolean;
}
export function StatCard({
  label,
  value,
  variation,
  up
}: StatCardProps) {
  return <Card className="bg-white border border-[#E5E5E5] rounded-xl shadow-none">
      <CardContent className="p-4">
        <p className="font-semibold text-[#454545] text-xs">{label}</p>
        <p className="font-semibold text-[#F58320] text-left text-base">{value}</p>
      </CardContent>
    </Card>;
}