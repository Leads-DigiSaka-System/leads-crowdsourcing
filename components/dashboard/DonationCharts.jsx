import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"
import { TrendingUp, Calendar } from "lucide-react"

export default function DonationCharts({ analytics }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const chartConfig = {
        amount: {
            label: "Amount",
            color: "hsl(var(--chart-1))",
        },
        count: {
            label: "Count",
            color: "hsl(var(--chart-2))",
        },
    }

    const EmptyState = ({ icon: Icon, message }) => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
                <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{message}</p>
            </div>
        </div>
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Your Donation Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {analytics.chartData.length > 0 ? (
                        <ChartContainer config={chartConfig}>
                            <LineChart data={analytics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    formatter={(value, name) => [
                                        name === 'amount' ? formatCurrency(value) : value,
                                        name === 'amount' ? 'Amount' : 'Count'
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="var(--color-amount)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-amount)" }}
                                />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <EmptyState icon={TrendingUp} message="No data for selected period" />
                    )}
                </CardContent>
            </Card>

            {/* Donation Count Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Donation Frequency
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {analytics.chartData.length > 0 ? (
                        <ChartContainer config={chartConfig}>
                            <BarChart data={analytics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    formatter={(value) => [value, 'Donations']}
                                />
                                <Bar dataKey="count" fill="var(--color-count)" />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <EmptyState icon={Calendar} message="No data for selected period" />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
