"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

export default function FundingTrendChart({ data }) {
    const chartData = data ?
        Object.entries(data).map(([month, monthData]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount: monthData.amount, // Don't divide by 100
            pledges: monthData.count
        })) : []

    return (
        <Card>
            <CardHeader>
                <CardTitle>Funding Trend</CardTitle>
                <CardDescription>Monthly funding over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
                <ChartContainer
                    config={{
                        amount: { label: "Amount (PHP)", color: "hsl(var(--primary))" }
                    }}
                    className="h-[250px] sm:h-[300px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₱${value}`}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
