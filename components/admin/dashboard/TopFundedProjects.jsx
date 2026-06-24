import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { capitalizeFirstWordOnly, smartTitle } from "@/lib/utils"

export default function TopFundedProjects({ projects }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount) // Don't divide by 100
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Funded Projects</CardTitle>
                <CardDescription>Projects with highest funding</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {projects?.map((project, index) => (
                        <div key={project.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full font-semibold text-white bg-primary shadow-sm text-xs select-none`}>{index + 1}</span>
                                    <span className="text-sm">{capitalizeFirstWordOnly(project.title)}</span>
                                </div>
                                <Badge variant="secondary" className={'bg-accent'}>{smartTitle(project.category.name)}</Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatCurrency(project.pledged)}</span>
                                    <span>{formatCurrency(project.goal)}</span>
                                </div>
                                <Progress
                                    value={(project.pledged / project.goal) * 100}
                                    className="h-2"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
