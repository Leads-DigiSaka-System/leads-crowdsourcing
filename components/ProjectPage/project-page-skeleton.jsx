import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ProjectPageSkeleton() {
    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Project Detail Section Skeleton */}
                <section className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <Skeleton className="h-8 w-3/4 mb-4" /> {/* Title */}
                            <Skeleton className="h-5 w-1/2 mb-6" /> {/* Authors */}
                            <Skeleton className="h-4 w-full mb-2" /> {/* Description line 1 */}
                            <Skeleton className="h-4 w-full mb-2" /> {/* Description line 2 */}
                            <Skeleton className="h-4 w-2/3 mb-6" /> {/* Description line 3 */}

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <Skeleton className="h-4 w-24 mb-2" /> {/* Pledged label */}
                                    <Skeleton className="h-8 w-32" /> {/* Pledged amount */}
                                </div>
                                <div>
                                    <Skeleton className="h-4 w-24 mb-2" /> {/* Goal label */}
                                    <Skeleton className="h-8 w-32" /> {/* Goal amount */}
                                </div>
                            </div>

                            <Skeleton className="h-2 w-full mb-2" /> {/* Progress bar */}
                            <Skeleton className="h-4 w-20 mb-8" /> {/* Progress percentage */}

                            <div className="flex gap-4">
                                <Skeleton className="h-12 w-40 rounded-lg" /> {/* Back Project button */}
                                <Skeleton className="h-12 w-40 rounded-lg" /> {/* How it works button */}
                            </div>
                        </div>
                        <div>
                            <Skeleton className="w-full h-64 rounded-lg" /> {/* Image */}
                        </div>
                    </div>
                </section>

                {/* Section Skeletons */}
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="mb-8">
                        <CardHeader>
                            <Skeleton className="h-8 w-64" /> {/* Section Title */}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            {i === 3 && ( // For team section, add member skeletons
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
