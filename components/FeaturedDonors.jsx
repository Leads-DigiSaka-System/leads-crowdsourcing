"use client";
import { FeaturedDonorsSkeleton } from "@/components/featured-donors-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { nameTitleCase } from "@/lib/utils";
import { Crown, Heart, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

const FeaturedDonors = ({ donors }) => {
  const [data, setData] = useState(Array.isArray(donors) ? donors : null);
  const [loading, setLoading] = useState(!Array.isArray(donors));

  useEffect(() => {
    if (Array.isArray(donors)) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/donors/top?limit=5", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load donors");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [donors]);

  if (loading) return <FeaturedDonorsSkeleton />;

  if (!data || data.length === 0) {
    return (
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-center mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary-foreground mr-3" />
                <h2 className="text-xl font-bold text-primary-foreground">
                  Featured Donors
                </h2>
              </div>
              <p className="text-lg text-primary-foreground/90 mb-8">
                Be the first to support groundbreaking research and become a
                featured donor.
              </p>
              <div className="bg-background rounded-xl p-8 border-2 border-dashed border-muted-foreground/20">
                <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No donations yet. Your contribution could be featured here!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  // Function to format donation amount
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `₱${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₱${(amount / 1000).toFixed(1)}K`;
    }
    return `₱${amount.toLocaleString()}`;
  };

  // Function to get rank icon
  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="w-4 h-4" />;
      case 1:
        return <Trophy className="w-4 h-4 " />;
      case 2:
        return <Trophy className="w-4 h-4 " />;
      default:
        return <Heart className="w-4 h-4 " />;
    }
  };

  // Function to get rank color
  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
      case 1:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
      case 2:
        return "bg-gradient-to-br from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gradient-to-br from-primary to-primary/80 text-white";
    }
  };

  // Note: empty-state is already handled above using fetched `data`

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="flex items-center justify-center mb-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary mr-3" />
              <h2 className="text-xl font-bold text-white">Featured Donors</h2>
            </div>
            <p className="text-lg text-white">
              Celebrating our top supporters who make groundbreaking research
              possible.
            </p>
          </div>
        </div>

        {/* Donors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {data.map((donor, index) => (
            <div
              key={donor.id}
              className={`
                relative bg-background rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                ${index === 0 ? "ring-2 ring-yellow-400 shadow-lg" : ""}
                ${index === 1 ? "ring-2 ring-gray-300" : ""}
                ${index === 2 ? "ring-2 ring-amber-400" : ""}
              `}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -right-3">
                <Badge
                  className={`
                  px-3 py-1 text-xs font-bold shadow-lg
                  ${getRankColor(index)}
                `}
                >
                  <span className="flex items-center gap-1">
                    {getRankIcon(index)}#{index + 1}
                  </span>
                </Badge>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <Avatar
                  className={`
                  w-16 h-16 ring-4 ring-background shadow-lg
                  ${index === 0 ? "ring-yellow-400" : ""}
                  ${index === 1 ? "ring-gray-300" : ""}
                  ${index === 2 ? "ring-amber-400" : ""}
                `}
                >
                  <AvatarImage
                    src={donor.image || ""}
                    alt={donor.name || "Donor"}
                  />
                  <AvatarFallback className="bg-primary text-white font-bold text-lg">
                    {(donor.name || "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Donor Info */}
              <div className="text-center">
                <h3
                  className="font-bold text-foreground mb-1 truncate"
                  title={donor.name}
                >
                  {nameTitleCase(donor.name) || "Anonymous Donor"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  @{donor.username || "anonymous"}
                </p>

                {/* Donation Amount */}
                <div
                  className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                  ${index === 0 ? "bg-yellow-100 text-yellow-800" : ""}
                  ${index === 1 ? "bg-gray-100 text-gray-800" : ""}
                  ${index === 2 ? "bg-amber-100 text-amber-800" : ""}
                  ${index > 2 ? "bg-primary/10 text-primary" : ""}
                `}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  {formatAmount(donor.totalDonated)}
                </div>

                {/* Donation Count */}
                <p className="text-xs text-muted-foreground mt-2">
                  {donor.donationCount} donation
                  {donor.donationCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-white mb-4">
            Want to see your name here? Support a research project today!
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDonors;
