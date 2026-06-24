"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

export function PaymentSuccessModal({ open, onOpenChange, projectTitle }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open && mounted) {
            // Fire confetti multiple times for a better effect
            const duration = 3000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min
            }

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)

                // Left side
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                })

                // Right side
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                })
            }, 250)

            return () => clearInterval(interval)
        }
    }, [open, mounted])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-green-400 opacity-75"></div>
                            <div className="relative rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Thank You for Your Support! 🎉
                    </DialogTitle>
                </DialogHeader>

                <div className="text-center space-y-4 pt-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                        <span>Your contribution makes a difference!</span>
                        <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                    </div>

                    {projectTitle && (
                        <p className="text-sm text-muted-foreground">
                            Your donation to <span className="font-semibold text-foreground">"{projectTitle}"</span> has been successfully processed.
                        </p>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span>You'll receive a confirmation email shortly</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span>Your impact will help advance important research</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span>Track your contribution in your dashboard</span>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                        Together, we're making science more accessible and impactful! 🔬✨
                    </p>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full"
                        size="lg"
                    >
                        Continue Exploring
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
