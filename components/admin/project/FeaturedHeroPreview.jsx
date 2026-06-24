"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";
import { smartTitle } from "@/lib/utils";

export default function FeaturedHeroPreview() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true
        const fetchFeatured = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/projects/featured?limit=5', { cache: 'no-store' })
                if (!res.ok) throw new Error('Failed to load featured projects')
                const data = await res.json()
                if (!active) return
                setItems(Array.isArray(data) ? data.slice(0, 5) : [])
                setError("")
            } catch (e) {
                if (!active) return
                setError(e.message || 'Something went wrong')
            } finally {
                if (active) setLoading(false)
            }
        }
        fetchFeatured()
        const onUpdated = () => fetchFeatured()
        window.addEventListener('featured-updated', onUpdated)
        return () => { active = false; window.removeEventListener('featured-updated', onUpdated) }
    }, [])

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Featured research (Hero)
                </CardTitle>
                <CardDescription>
                    Up to 5 projects shown in the homepage hero carousel. Toggle using the star button in the table actions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading featured…</div>
                ) : error ? (
                    <div className="text-destructive">{error}</div>
                ) : items.length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center">
                        <div className="text-sm text-muted-foreground">
                            No featured projects yet. Please add a featured research by clicking the star button in the Actions column above.
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {items.map((p) => (
                            <div key={p.id} className="rounded-lg overflow-hidden border bg-card group hover:shadow-sm transition-shadow">
                                <div className="relative aspect-[4/3] bg-muted">
                                    <Image
                                        src={p.image || '/hero-image.jpg'}
                                        alt={p.imageAlt || p.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                                        className="object-cover"
                                    />
                                    <div className="absolute left-2 top-2">
                                        <Badge variant="secondary" className="bg-accent  text-foreground">
                                            {smartTitle(p.category?.name)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="font-medium leading-snug line-clamp-2">{p.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{p.authors}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
