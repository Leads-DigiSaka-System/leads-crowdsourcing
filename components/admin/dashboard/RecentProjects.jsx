import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye } from "lucide-react";
import Link from "next/link";
import {
  capitalizeFirstWordOnly,
  nameTitleCase,
  smartTitle,
} from "@/lib/utils";

export default function RecentProjects({ projects }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Latest projects added to the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects?.map((project) => (
            <div key={project.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={project.image} alt={project.title} />
                <AvatarFallback>
                  {project.title.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {capitalizeFirstWordOnly(project.title)}
                </p>
                <p className="text-sm text-muted-foreground">
                  by {nameTitleCase(project.teamMembers[0]?.name)}
                </p>
              </div>
              <Badge variant="outline" className={"bg-accent"}>
                {smartTitle(project.category.name)}
              </Badge>
              <Link href={`/discover/${project.slug || project.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
