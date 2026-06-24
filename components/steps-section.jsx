"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search, HeartHandshake, ScrollText, Globe2, ArrowRight, ArrowDown } from "lucide-react";

const steps = [
    {
        icon: Search,
        title: "Find Project of Choice",
        description: "Discover and select a research project that aligns with your interests and values.",
    },
    {
        icon: HeartHandshake,
        title: "Select Funding Options",
        description: "Choose your preferred funding method and contribution level to support the research.",
    },
    {
        icon: ScrollText,
        title: "Research Journey",
        description: "Follow the research progress, receive updates, and engage with the scientific process.",
    },
    {
        icon: Globe2,
        title: "See the Impact",
        description: "Witness the real-world impact of your contribution and the research outcomes.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

export default function StepsSection() {
    return (
        <section className="pt-16 bg-primary">
            <div className="max-w-6xl mx-auto px-4">
                {/* Title */}
                <motion.h2
                    className="text-center text-3xl font-bold mb-14 text-white"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    From Idea to Impact —{" "}
                    <span className="">Your Journey Starts Here</span>
                </motion.h2>

                <div className="flex flex-col space-y-8 lg:flex-row lg:justify-between lg:items-stretch lg:space-y-0 lg:space-x-0">
                    {steps.map((step, i) => (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center lg:flex-1 lg:flex">
                                <motion.div
                                    className="relative w-full max-w-sm h-full text-center transition transform hover:-translate-y-1 flex flex-col lg:h-full"
                                    variants={cardVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.2 }}
                                >
                                    <Card className="bg-white rounded-2xl shadow-lg border-none h-full flex flex-col">
                                        <CardHeader className="flex flex-col items-center flex-shrink-0">
                                            <div className="mx-auto flex items-center justify-center w-16 h-16 text-primary">
                                                <step.icon className="w-8 h-8" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center flex-grow">
                                            <CardTitle className="mt-2 font-semibold text-lg text-primary">
                                                Step {i + 1}: <span className="">{step.title}</span>
                                            </CardTitle>
                                            <CardDescription className="mt-2 leading-relaxed text-center flex-grow flex items-center">
                                                {step.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Mobile Arrow Down */}
                                {i < steps.length - 1 && (
                                    <motion.div
                                        className="flex lg:hidden items-center justify-center mt-4 mb-4"
                                        initial={{ opacity: 0, y: -20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: (i + 1) * 0.2 }}
                                    >
                                        <ArrowDown className="w-6 h-6 text-white" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Desktop Arrow Right */}
                            {i < steps.length - 1 && (
                                <motion.div
                                    className="hidden lg:flex items-center justify-center flex-shrink-0 px-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: (i + 1) * 0.2 }}
                                >
                                    <ArrowRight className="w-6 h-6 text-white" />
                                </motion.div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}