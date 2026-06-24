import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DollarSign, FileCheck, Wallet } from "lucide-react";

export default function ResearcherStats({ stats }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statItems = [
    {
      title: "Projects Approved",
      value: stats.projectCount.toLocaleString(),
      description: "Your active research projects",
      icon: FileCheck,
      color: "blue",
    },
    {
      title: "Total Funds Received",
      value: formatCurrency(stats.totalFunds),
      description: "Total donations to your projects",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Claimable Funds",
      value: formatCurrency(stats.claimableFunds),
      description: "Available for withdrawal",
      icon: Wallet,
      color: "purple",
      action: (
        <Button
          size="sm"
          className="w-full"
          disabled={stats.claimableFunds <= 0}
        >
          Claim Funds
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Researcher Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className={cn("h-5 w-5 text-primary")} />
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-2xl font-bold leading-none">{stat.value}</p>

                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>

            {stat.action && <div className="mt-4 pt-2">{stat.action}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
