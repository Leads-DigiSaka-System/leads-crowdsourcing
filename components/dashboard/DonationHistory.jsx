import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import DonationsTable, {
  SignatureBadge,
} from "@/components/donations/DonationsTable";

export default function DonationHistory({
  donations,
  page = 1,
  pageCount = 1,
  onPageChange,
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Donation History</CardTitle>
      </CardHeader>
      <CardContent>
        {donations.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No donations yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start supporting research projects and make an impact!
            </p>
            <Link href="/discover">
              <Button>Explore Projects</Button>
            </Link>
          </div>
        ) : (
          <DonationsTable
            data={donations}
            rowKey={(d) => d.id}
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
            columns={[
              {
                id: "project",
                header: "Project",
                cell: (d) => (
                  <div>
                    <Link
                      href={`/discover/${d.project.slug || d.project.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {d.project.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      by {d.project.authors}
                    </p>
                  </div>
                ),
              },
              {
                id: "category",
                header: "Category",
                cell: (d) => (
                  <Badge
                    variant="secondary"
                    className={"capitalize bg-primary text-white"}
                  >
                    {typeof d.project.category === "object" &&
                    d.project.category !== null
                      ? (d.project.category.name ?? "Uncategorized")
                      : (d.project.category ?? "Uncategorized")}
                  </Badge>
                ),
              },
              {
                id: "amount",
                header: "Amount",
                className: "font-medium text-green-600",
                cell: (d) => formatCurrency(d.amount),
              },
              {
                id: "date",
                header: "Date",
                accessor: (d) => formatDate(d.createdAt),
              },
              {
                id: "signature",
                header: "Solana Signature",
                cell: (d) => <SignatureBadge signature={d.solanaSignature} />,
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
