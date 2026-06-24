"use client";

import { Button } from "@/components/ui/button";

import { motion } from "framer-motion";
import { Check, Crown, DollarSign, Heart, Star } from "lucide-react";
import Link from "next/link";

const SubscriptionPlans = () => {
  const plans = [
    {
      name: "Basic",
      price: "₱500",
      period: "monthly",
      icon: Star,
      description:
        "Start your research support journey with essential benefits.",
      features: [
        "Digital CSR Certificate",
        "Basic impact tracking",
        "Quarterly updates",
        "Community access",
        "Email support",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Standard",
      price: "₱1,500",
      period: "monthly",
      icon: Crown,
      description:
        "Enhanced support for those committed to sustainable research.",
      features: [
        "All Basic features",
        "Physical & Digital certificates",
        "Carbon credits included",
        "Monthly detailed reports",
        "Priority support",
        "Social media recognition",
      ],
      buttonText: "Choose Standard",
      popular: false,
    },
    {
      name: "Legacy",
      price: "₱5,000",
      period: "monthly",
      icon: Heart,
      description:
        "Premium plan for making a lasting research impact. Open to individuals, philanthropists, and organizations.",
      features: [
        "All Standard features",
        "Premium ecosystem analytics",
        "Branded impact reports",
        "Public recognition campaigns",
        "Direct researcher contact",
        "Custom research focus areas",
        "Dedicated account manager",
        "Invitation to research beneficiaries / study site",
      ],
      buttonText: "Go Legacy",
      popular: false,
    },
    {
      name: "Big Donors",
      price: "₱50,000",
      period: "monthly",
      icon: Crown,
      description:
        "Dedicated major-donor sponsorship for organizations support",
      features: [
        "Everything in the Legacy plan",
        "Executive-level briefings and updates",
        "First access to new studies & pilot programs",
        "Invitations to lab visits and field activities",
        "Custom annual impact report",
        "Participation in our annual donor roundtable",
        "Shares and ownership of any tech spinoff",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8 sm:mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-primary text-white px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base mb-4 font-semibold">
              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Coming Soon</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
              Choose Your <span className="text-primary">Research Support</span>{" "}
              Plan
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Select the plan that matches your commitment to advancing
              scientific research and creating positive impact.
            </p>
            <p className="text-sm sm:text-sm text-primary mt-2 font-bold">
              Subscription plans will be available soon. Stay tuned!
            </p>
          </motion.div>

          {/* Plans Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`relative bg-background rounded-2xl border-2 p-4 sm:p-6 lg:p-8 transition-all duration-300 opacity-60 ${
                  plan.popular
                    ? "border-primary shadow-lg sm:scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4 sm:mb-6">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <plan.icon
                      className={`w-6 h-6 sm:w-8 sm:h-8 ${
                        plan.popular ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm sm:text-base text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm px-2">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-2 sm:gap-3"
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-xs sm:text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <Button
                  className={`w-full py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl"
                      : "bg-background hover:bg-muted text-foreground border-2 border-border hover:border-primary/50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  disabled
                >
                  Coming Soon
                </Button>
              </motion.div>
            ))}

            {/* Custom Amount Card */}
            <motion.div
              variants={cardVariants}
              className="relative bg-background rounded-2xl border-2 border-border p-4 sm:p-6 lg:p-8 transition-all duration-300 opacity-60"
            >
              {/* Custom Plan Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-muted rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Custom Donation
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm px-2">
                  Donate directly to a research project — one-time contribution
                </p>
              </div>

              {/* Short note about custom donations */}
              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-muted-foreground text-center">
                  Minimum donation ₱100. You will be able to choose a project to
                  donate to after you proceed.
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-xs sm:text-sm">
                    Flexible contribution
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-xs sm:text-sm">
                    Impact tracking
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-xs sm:text-sm">
                    Recognition certificate
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-xs sm:text-sm">
                    Community access
                  </span>
                </li>
              </ul>

              {/* Button */}
              <Link href={"/discover"}>
                <Button
                  className={`w-full py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base bg-primary text-white`}
                >
                  Donate to a Project
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            className="text-center mt-8 sm:mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base px-4">
              All plans include secure payment processing and can be cancelled
              anytime.
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex-wrap justify-center">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-center">
                100% of contributions go directly to research projects
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
