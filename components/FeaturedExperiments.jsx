// Mark as a Client Component
"use client";
import { useEffect, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import ProjectCard from './ProjectCard';
import Link from 'next/link';
import { FeaturedExperimentsSkeleton } from '@/components/featured-experiment-skeleton';

// This component now receives projects as a prop
const FeaturedExperiments = ({ projects }) => {
    const initial = Array.isArray(projects) ? projects.slice(0, 3) : null
    const [data, setData] = useState(initial)
    const [loading, setLoading] = useState(!Array.isArray(projects))

    useEffect(() => {
        if (Array.isArray(projects)) return
        let cancelled = false
        async function load() {
            try {
                // Fetch exactly up to 3 featured projects
                const res = await fetch('/api/projects/featured?limit=3', { cache: 'no-store' })
                if (!res.ok) throw new Error('Failed to load projects')
                const json = await res.json()
                if (!cancelled) setData(Array.isArray(json) ? json.slice(0, 3) : [])
            } catch (e) {
                console.error(e)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [projects])

    if (loading) return <FeaturedExperimentsSkeleton />

    if (!data || data.length === 0) return null

    return (
        <>
            {/* Featured Experiments Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-6 max-w-7xl ">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <div className="flex items-center mb-4">
                                <Star className="w-6 h-6 text-primary mr-3" />
                                <h2 className="text-xl font-bold text-foreground">Featured Experiments</h2>
                            </div>
                            <p className="text-lg text-muted-foreground">
                                Discover groundbreaking research projects that need your support
                            </p>
                        </div>
                        <Link href={'/discover'}>
                            <button className="hidden cursor-pointer md:flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-200 transform">
                                See All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </Link>
                    </div>
                    {/* Experiments Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                        {data.slice(0, 3).map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                teams={project.teamMembers}
                                description={project.overview}
                            />
                        ))}
                    </div>
                    {/* Mobile See All Button */}
                    <div className="flex justify-center mt-12 md:hidden">
                        <Link href={'/discover'}>
                            <button className="flex cursor-pointer items-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-1">
                                See All Experiments
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}

export default FeaturedExperiments
