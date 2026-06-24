import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedDonorsSkeleton() {
    return (
        <section className="py-20 bg-muted/50">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Section Header */}
                <div className="flex items-center justify-center mb-12">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <Heart className="w-6 h-6 text-primary mr-3" />
                            <h2 className="text-xl font-bold text-foreground">Featured Donors</h2>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Celebrating our top supporters who make groundbreaking research possible
                        </p>
                    </div>
                </div>

                {/* Donors Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="relative bg-background rounded-xl p-6 border"
                        >
                            {/* Rank Badge Skeleton */}
                            <div className="absolute -top-3 -right-3">
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>

                            {/* Avatar Skeleton */}
                            <div className="flex justify-center mb-4">
                                <Skeleton className="w-16 h-16 rounded-full" />
                            </div>

                            {/* Donor Info Skeleton */}
                            <div className="text-center space-y-2">
                                <Skeleton className="h-4 w-24 mx-auto" />
                                <Skeleton className="h-3 w-16 mx-auto" />
                                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                                <Skeleton className="h-3 w-12 mx-auto" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action Skeleton */}
                <div className="text-center mt-12 space-y-4">
                    <Skeleton className="h-4 w-64 mx-auto" />
                    <Skeleton className="h-10 w-32 mx-auto rounded-xl" />
                </div>
            </div>
        </section>
    );
}
