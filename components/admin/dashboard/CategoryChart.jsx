"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { smartTitle } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const categoryColors = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function CategoryChart({ data }) {
  const chartData =
    data?.map((cat, index) => ({
      name: cat.category || "Uncategorized",
      value: cat._count.id,
      color: categoryColors[index % categoryColors.length],
    })) || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Projects by Category</CardTitle>
        <CardDescription>Distribution of research projects</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-2 sm:p-6 min-h-[300px]">
        <ChartContainer
          config={{
            value: { label: "Projects" },
          }}
          className="h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius="60%"
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${smartTitle(name)}: ${value}`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
