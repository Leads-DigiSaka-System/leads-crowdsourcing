'use client'
import { Eye, Link, Shield, CheckCircle, ExternalLink, Zap } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";


const featuresData = [
    {
        icon: Shield,
        title: "Secure Transactions",
        description:
            "All donations are protected by blockchain technology, ensuring your funds are secure and reach verified researchers safely.",
        badge: "100% Secure Blockchain Secured",
        delay: 0,
    },
    {
        icon: Eye,
        title: "Complete Traceability",
        description:
            "See exactly where your money goes and follow the research progress in real-time with complete transparency.",
        badge: "Full Visibility",
        delay: 0.1,
    },
    {
        icon: Link,
        title: "Credible Researchers",
        description:
            "Every researcher is thoroughly Credible and vetted, ensuring your donations support legitimate, impactful scientific work.",
        badge: "Trusted Scientists",
        delay: 0.2,
    },
];

const TransparencySection = () => {
    const [features] = useState(featuresData);
    return (
        <div className=" py-2">
            <div className="max-w-7xl mx-auto mt-24 mb-16 px-4 sm:px-6 lg:px-8">
                <div className="relative z-10">
                    <div className="text-center mb-20">
                        <motion.div
                            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Zap className="w-4 h-4" />
                            #1 System for Transparency & Traceability
                        </motion.div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-8 tracking-tight">
                            Traceability <span className="text-primary">QR code</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium mb-8">
                            Each donation will be given a <span className="text-primary">"hash and QR"</span> that can be used to track where exactly it goes in the research activitiy. Track your  with immutable records and complete traceability.
                        </p>
                        <motion.a
                            href="https://web.senate.gov.ph/press_release/2025/0902_aquino1.asp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Learn about PH Blockchain Bill
                            <ExternalLink className="w-4 h-4" />
                        </motion.a>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 w-full">
                        {features.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    className="text-center space-y-6 flex flex-col h-full"
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.6, ease: "easeOut", delay: feature.delay }}
                                >
                                    <div className="w-20 h-20 flex items-center justify-center mx-auto">
                                        <Icon className="w-12 h-12 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                                    <p className="text-base text-muted-foreground leading-relaxed flex-grow">
                                        {feature.description}
                                    </p>
                                    <div className="flex items-center justify-center space-x-2 text-primary font-semibold h-8">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm">{feature.badge}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TransparencySection