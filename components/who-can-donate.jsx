"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Heart,
  Building2,
  Users,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { shortSig } from "@/lib/utils";

export default function HomePage() {
  const [recent, setRecent] = useState({ loading: true, donations: [] });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/donations/recent?limit=5");
        const data = await res.json();
        if (active && data.success) {
          setRecent({ loading: false, donations: data.donations || [] });
        } else if (active) {
          setRecent({ loading: false, donations: [] });
        }
      } catch (e) {
        if (active) setRecent({ loading: false, donations: [] });
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const donorGroups = [
    // {
    //     icon: GraduationCap,
    //     title: "Students",
    //     description: "Make a difference while learning",
    // },
    {
      icon: User,
      title: "Individuals",
      description: "Personal contributions that count",
    },
    {
      icon: Heart,
      title: "Philanthropists",
      description: "Dedicated to creating change",
    },
    {
      icon: Building2,
      title: "Corporations",
      description: "Business partnerships for impact",
    },
    {
      icon: Users,
      title: "Communities",
      description: "Collective action for good",
    },
    {
      icon: Briefcase,
      title: "Professionals",
      description: "Expertise and resources combined",
    },
  ];

  return (
    <section className="py-20 px-4 md:px-8 lg:mb-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12">
        {/* Left: Who can donate */}
        <div className="lg:col-span-2">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Who Can Donate?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everyone has the power to make a difference. Join our community of
              changemakers.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
            {donorGroups.map((group, index) => {
              const IconComponent = group.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6"
                >
                  <div className="mb-4 p-4 rounded-full">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-2">
                    {group.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {group.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        {/* Right: Recent donations */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold tracking-tight mb-1">
              Recent Donations
            </h3>
            <p className="text-muted-foreground text-sm">
              Latest 5 successful contributions
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Signatures link to Solana Explorer — publicly verifiable on-chain
              records for traceability.
            </p>
          </div>
          <div className="space-y-4">
            {recent.loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-md bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            )}
            {!recent.loading && recent.donations.length === 0 && (
              <p className="text-muted-foreground text-sm">No donations yet.</p>
            )}
            {!recent.loading && recent.donations.length > 0 && (
              <ul className="space-y-3">
                {recent.donations.map((d) => (
                  <li
                    key={d.id}
                    className="group rounded-lg border bg-card p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/discover/${d.project.slug || d.project.id}`}
                          className="font-medium text-sm text-foreground hover:text-primary line-clamp-1"
                        >
                          {d.project.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-semibold">
                            ₱{(d.amount || 0).toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        {d.solanaSignature ? (
                          <div className="flex items-center gap-2">
                            <Link
                              href={`https://explorer.solana.com/tx/${d.solanaSignature}?cluster=mainnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1"
                              title="View transaction on Solana Explorer — on-chain, publicly verifiable"
                              aria-label={`View transaction ${d.solanaSignature} on Solana Explorer (on-chain)`}
                            >
                              {shortSig(d.solanaSignature)}{" "}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            No signature
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {new Date(d.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(d.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
