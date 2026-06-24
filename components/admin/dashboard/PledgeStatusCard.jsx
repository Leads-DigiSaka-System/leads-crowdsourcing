import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const categoryColors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"
]

export default function PledgeStatusCard({ statusData }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pledge Status</CardTitle>
                <CardDescription>Distribution of pledge statuses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {statusData?.map((status, index) => (
                        <div key={status.status} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                                />
                                <span className="text-sm font-medium capitalize">
                                    {status.status}
                                </span>
                            </div>
                            <Badge variant="outline">{status._count.id}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
