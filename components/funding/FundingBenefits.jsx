"use client";

import { motion } from "framer-motion";
import { Award, CheckCircle, Leaf, Megaphone, TrendingUp } from "lucide-react";

const FundingBenefits = () => {
  // Toggle to show/hide bullet-point checkpoints under each benefit
  const showPoints = false;
  const benefits = [
    {
      icon: Award,
      title: "Corporate Social Responsibility (CSR) Certificate",
      description:
        "Official digital and physical certificates recognizing your support for scientific research, with branding and outreach opportunities.",
      points: [
        "Digital and physical certificates",
        "Corporate branding and co-marketing",
        "Verifiable proof of social responsibility",
      ],
    },
    {
      icon: TrendingUp,
      title: "Equity Opportunities",
      description:
        "Receive priority access or equity shares in any technology spin-offs, patents, or innovations developed through your funded research.",
      points: [
        "Priority allocation in qualified spin-offs",
        "Access to IP commercialization updates",
        "Early insights on patentable innovations",
      ],
    },
    {
      icon: CheckCircle,
      title: "Tax Benefits",
      description:
        "As a DOST-recognized and SEC-registered research foundation, donations to IMPACT R&D may qualify for full income-tax deductibility and donor’s-tax exemption under BIR RR 13-98 and the TRAIN Law.",
      points: [
        "Official receipts and certification",
        "Documentation support for compliance",
        "Guidance on eligibility with your tax advisor",
      ],
    },
    {
      icon: Leaf,
      title: "Carbon Credits & Ecosystem Impact Tracking",
      description:
        "Access verified carbon-offset programs and real-time environmental metrics tied to your contributions.",
      points: [
        "Verified offset/credit programs",
        "Real-time impact dashboards",
        "Detailed environmental metrics and reports",
      ],
    },
    {
      icon: Megaphone,
      title: "Visibility & Recognition",
      description:
        "Featured acknowledgment in our project dashboards, publications, and partner communications—demonstrating your leadership in supporting Philippine science.",
      points: [
        "Spotlight in dashboards and reports",
        "Acknowledgment in publications",
        "Partner and media outreach opportunities",
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
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
    <section className="py-24 -mb-16">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Why Supporting Research Matters — <br />
              <span className="text-primary">and Benefits You Too</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your contribution goes beyond funding — it creates measurable
              impact and gives you tangible rewards that showcase your
              commitment to a better future.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            className="grid lg:grid-cols-2 gap-16 mb-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <div className="space-y-6">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-colors duration-300">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2 transition-colors duration-300">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>

                  {/* Points List (temporarily hidden) */}
                  {showPoints && (
                    <div className="ml-16">
                      <ul className="space-y-2">
                        {benefit.points.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-foreground text-sm">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Video Placeholder Section */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Stories from Beneficiaries
              </h2>
              <p className="text-lg text-muted-foreground">
                See how your support makes a real difference in communities
                around the world
              </p>
            </div>
            <div className="max-w-4xl mx-auto bg-muted/30 rounded-2xl p-8 border-2 border-dashed border-muted-foreground/20">
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Video Coming Soon
                </h3>
                <p className="text-center">
                  Inspiring stories and testimonials from communities
                  <br />
                  that have benefited from sustainable research initiatives
                </p>
              </div>
            </div>
          </motion.div>

          {/* What We Avoid Section */}
          <motion.div
            className="mb-20 bg-primary rounded-2xl p-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                We Avoid...
              </h2>
              {/* <p className="text-lg text-muted-foreground">
                                Our commitment to ethical and truly sustainable research
                            </p> */}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">🚫</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Greenwashing</h3>
                <p className="text-sm text-white">
                  We ensure all research has measurable, verifiable
                  environmental impact
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">⛏️</span>
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Unsustainable Mining
                </h3>
                <p className="text-sm text-white">
                  We reject projects that cause environmental destruction or
                  exploit workers
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary text-2xl">🏭</span>
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Harmful Industries
                </h3>
                <p className="text-sm text-white">
                  We avoid supporting research that benefits polluting or
                  exploitative industries
                </p>
              </div>
            </div>
          </motion.div>

          {/* Call to Action Section */}
          {/* <motion.div
            className="text-center py-16 border-t border-border"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Make an Impact?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                Start Supporting Research
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-background hover:bg-muted text-foreground border-2 border-border hover:border-primary/50 px-8 py-4 rounded-xl font-semibold transition-all duration-200"
              >
                Learn More About Benefits
              </Button>
            </div>
          </motion.div> */}

          {/* Impact Statement */}
          {/* <motion.div
                        className="mt-16 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-semibold">
                            <Globe className="w-4 h-4" />
                            <span>Building a Better Future Through Research</span>
                        </div>
                    </motion.div> */}
        </div>
      </div>
    </section>
  );
};

export default FundingBenefits;
