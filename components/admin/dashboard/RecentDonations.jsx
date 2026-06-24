import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  capitalizeFirstWordOnly,
  nameTitleCase,
  smartTitle,
} from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

export default function RecentDonations({ donations }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Sort donations by date in descending order
  const sortedDonations = donations?.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
        <CardDescription>
          Latest donations received on the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {sortedDonations?.map((donation) => (
            <div key={donation.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={donation.user?.image}
                  alt={donation.user?.name}
                />
                <AvatarFallback>
                  {donation.user?.name?.slice(0, 2).toUpperCase() || "AN"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {nameTitleCase(donation.user?.name || "Anonymous")}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary">
                    {formatCurrency(donation.amount)}
                  </span>{" "}
                  • {formatDate(donation.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  for {capitalizeFirstWordOnly(donation.project?.title)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={donation.status === "paid" ? "default" : "secondary"}
                  className={
                    donation.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : ""
                  }
                >
                  {smartTitle(donation.status)}
                </Badge>
                <Link
                  href={`/discover/${donation.project?.slug || donation.project?.id}`}
                >
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
