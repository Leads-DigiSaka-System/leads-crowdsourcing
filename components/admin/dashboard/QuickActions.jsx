import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function QuickActions() {
    return (
        <div className="hidden md:block">
            <Card>
                <CardHeader className="">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>

                </CardHeader>
                <CardContent className="-mt-4">
                    <div className="grid grid-cols-3 gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/admin/projects">
                                    <Button variant="outline" size="sm" className="w-full justify-center p-2">
                                        <FolderOpen className="w-4 h-4 text-primary" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Go to Project Page</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/admin/donations">
                                    <Button variant="outline" size="sm" className="w-full justify-center p-2">
                                        <DollarSign className="w-4 h-4 text-primary" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Go to Donations Page</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/admin/projects/add-project">
                                    <Button variant="outline" size="sm" className="w-full justify-center p-2">
                                        <Plus className="w-4 h-4 text-primary" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Go to Add Project Page</p>
                            </TooltipContent>
                        </Tooltip>



                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
