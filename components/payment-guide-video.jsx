'use client'
import { motion } from "framer-motion";

const PaymentGuideVideo = () => {
    return (
        <section className="py-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                        How to Donate
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Watch this short video guide to learn how to pay and donate.<br />
                    </p>
                </div>
                <div className="max-w-4xl mx-auto  rounded-2xl p-8">
                    <video
                        className="w-full rounded-xl border shadow-md"
                        controls
                        preload="metadata"
                        poster="/video_thumbnail.png"
                        style={{ background: "#222" }}
                    >
                        <source src="/payment-guide.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </motion.div>
        </section>
    )
}

export default PaymentGuideVideo