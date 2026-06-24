"use client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";

const packages = [
  {
    icon: Clock,
    title: "Quick Impact",
    description: "Small projects addressing focused societal problems <1 year.",
  },
  {
    icon: TrendingUp,
    title: "Long-term Impact",
    description:
      "Ends up with long-term impact like carbon credits projects that span up to 10 years.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function ResearchPackagesSection() {
  return (
    <section className="bg-primary pt-12 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-white">
            Research Packages
          </h2>
        </motion.div>

        {/* Grid layout with equal dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {packages.map((pkg, i) => (
            <motion.div
              key={i}
              className="w-full"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.3 }}
            >
              <Card className="bg-white rounded-2xl shadow-lg border-none h-full transition-transform hover:-translate-y-1">
                <div className="h-full flex flex-col p-6">
                  {/* Icon section with fixed height */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center w-16 h-16 text-primary">
                      <pkg.icon className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Content section */}
                  <div className="flex flex-col items-center text-center flex-grow">
                    <CardTitle className="font-bold text-xl text-primary mb-4">
                      {pkg.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed text-center">
                      {pkg.description}
                    </CardDescription>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
