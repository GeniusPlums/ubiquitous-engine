import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MetricsCardProps {
  title: string;
  value: number;
  total: number;
  trend?: number;
}

export function MetricsCard({ title, value, total, trend }: MetricsCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <Progress
          value={percentage}
          className="h-2 mt-2"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {percentage.toFixed(1)}% of total
          {trend !== undefined && (
            <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
              {" "}
              ({trend >= 0 ? "+" : ""}{trend}%)
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
