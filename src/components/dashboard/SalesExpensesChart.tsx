import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useMonthlyChartData } from "@/hooks/useChartData";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--success))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export function SalesExpensesChart() {
  const { chartData, isLoading } = useMonthlyChartData();

  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">Loading chart data...</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="text-xs"
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="var(--color-sales)"
          strokeWidth={2}
          dot={{ fill: "var(--color-sales)", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={{ fill: "var(--color-expenses)", r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
