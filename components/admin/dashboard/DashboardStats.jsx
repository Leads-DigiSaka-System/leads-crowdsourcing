import { StatCard } from "@/components/ui/stat-card";
import { FolderOpen, PhilippinePeso, Target, Users } from "lucide-react";

export default function DashboardStats({ stats }) {
  const formatCurrency = (amount) => {
    // Check if amount is already in correct format (not in centavos)
    // If amount is 300 and should display as ₱300.00, don't divide
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount); // Don't divide by 100
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={FolderOpen}
        title="Total Projects"
        value={stats.projects}
        description="Active research projects"
      />
      <StatCard
        icon={Users}
        title="Total Users"
        value={stats.users}
        description="Registered users"
      />
      <StatCard
        icon={Target}
        title="Total Pledges"
        value={stats.pledges}
        description="Funding commitments"
      />
      <StatCard
        icon={PhilippinePeso}
        title="Total Funding"
        value={formatCurrency(stats.funding)}
        description="Raised so far"
      />
    </div>
  );
}
