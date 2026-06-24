import { Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCardSkeleton } from './Discovery/ProjectCardSkeleton'; // Re-use existing project card skeleton

export function FeaturedExperimentsSkeleton() {
    return (
        <section className="py-20 bg-background">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Section Header Skeleton */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center mb-4">
                            <Star className="w-6 h-6 text-primary mr-3 animate-pulse" />
                            <Skeleton className="h-10 w-64" /> {/* Skeleton for title */}
                        </div>
                        <Skeleton className="h-6 w-96 mt-2" /> {/* Skeleton for description */}
                    </div>
                    <Skeleton className="hidden md:block h-12 w-32 rounded-xl" /> {/* Skeleton for See All button */}
                </div>
                {/* Experiments Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                </div>
                {/* Mobile See All Button Skeleton */}
                <div className="flex justify-center mt-12 md:hidden">
                    <Skeleton className="h-12 w-48 rounded-xl" />
                </div>
            </div>
        </section>
    )
}
