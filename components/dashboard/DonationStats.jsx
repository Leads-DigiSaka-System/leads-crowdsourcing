import { StatCard } from "@/components/ui/stat-card";
import { FileText, Heart, PhilippinePeso } from "lucide-react";

export default function DonationStats({ analytics }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Donated",
      value: formatCurrency(analytics.totalAmount),
      description: "Your contribution to research",
      icon: PhilippinePeso,
      color: "green",
    },
    {
      title: "Total Donations",
      value: analytics.totalDonations.toLocaleString(),
      description: "Times you've supported research",
      icon: Heart,
      color: "blue",
    },
    {
      title: "Projects Supported",
      value: analytics.supportedProjects.toLocaleString(),
      description: "Different research projects",
      icon: FileText,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          description={stat.description}
        />
      ))}
    </div>
  );
}
