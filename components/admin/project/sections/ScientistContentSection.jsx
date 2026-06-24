"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), { ssr: false })

export function ScientistContentSection({ form }) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Scientists Content</CardTitle>
                <CardDescription>Research context and significance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="contextAnswer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Context *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Research context and background" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="significanceAnswer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Significance *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Project significance and impact" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="goalsAnswer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Goals *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Project goals and objectives" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    )
}
