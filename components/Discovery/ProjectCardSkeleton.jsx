import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProjectCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="relative">
                <Skeleton className="w-full h-48" />
                <div className="absolute top-4 right-4">
                    <Skeleton className="w-16 h-6 rounded-full" />
                </div>
            </div>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-16 ml-2" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ProjectGridSkeleton({ count = 12 }) {
    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
            ))}
        </div>
    )
}
