"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const RichTextEditor = dynamic(() => import("@/components/ui/rich-text-editor"), { ssr: false })

export function ProjectContentSection({ form }) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Project Content</CardTitle>
                <CardDescription>Detailed project information and research content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="overview"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Overview *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Project overview and description" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="methods"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Methods *</FormLabel>
                            <FormControl>
                                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Research methods and methodology" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="labNotes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lab Notes</FormLabel>
                                <FormControl>
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Laboratory notes and technical details" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="discussion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Discussion</FormLabel>
                                <FormControl>
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Discussion and analysis" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
