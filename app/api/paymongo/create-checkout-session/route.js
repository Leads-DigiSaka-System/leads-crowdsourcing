import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'


export async function POST(req) {
    try {
        const body = await req.json()
        const { amount, title, projectId, projectSlug, userId } = body || {}

        if (!amount || Number(amount) < 100) {
            return NextResponse.json({ error: "Minimum amount is ₱100." }, { status: 400 })
        }

        if (!projectId && !projectSlug) {
            return NextResponse.json({ error: "Project ID or slug is required." }, { status: 400 })
        }

        const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY
        if (!PAYMONGO_SECRET_KEY) {
            return NextResponse.json({ error: "Server misconfiguration: missing PayMongo secret key." }, { status: 500 })
        }

        const url = "https://api.paymongo.com/v1/checkout_sessions"

        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        // Use slug if provided, otherwise fall back to projectId
        const urlSlug = projectSlug || projectId
        const projectUrl = urlSlug ? `${baseUrl}/discover/${urlSlug}` : `${baseUrl}/discover`
        const successUrl = urlSlug ? `${baseUrl}/discover/${urlSlug}?payment=success` : `${baseUrl}/discover?payment=success`

        // Build payment method types
        const ALL_ALLOWED_METHODS = [
            // Cards & e-wallets
            // "card",
            // "gcash",
            // "paymaya",
            // "grab_pay",
            "dob",
            "billease",
            "atome",
            "qrph",
        ]

        const rawEnvPmt = process.env.PAYMONGO_PAYMENT_METHOD_TYPES || ""
        const envList = rawEnvPmt
            .split(/[,\s]+/)
            .map(v => v.trim().toLowerCase())
            .filter(Boolean)
        const uniqueEnv = Array.from(new Set(envList))
        const filteredEnv = uniqueEnv.filter(v => ALL_ALLOWED_METHODS.includes(v))

        // If nothing configured, default to a broad-but-safe set. PayMongo will accept only what your account supports.
        const paymentMethodTypes = (filteredEnv.length > 0)
            ? filteredEnv
            : ["billease", "qrph", 'dob',]

        const payload = {
            data: {
                attributes: {
                    send_email_receipt: true,
                    description: title ? `Backing: ${title}` : "Donation",
                    statement_descriptor: "IMPACT R&D Research Fundsourcing",
                    metadata: {
                        projectId: projectId || null,
                        projectSlug: projectSlug || null,
                        userId: userId || null,
                    },
                    line_items: [
                        {
                            name: title || "Donation",
                            amount: Math.round(Number(amount) * 100), // in centavos
                            currency: "PHP",
                            quantity: 1,
                        },
                    ],
                    payment_method_types: paymentMethodTypes,
                    success_url: successUrl,
                    cancel_url: projectUrl,
                },
            },
        }

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
            },
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error("PayMongo checkout error:", data)
            return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 })
        }


        const checkoutUrl = data?.data?.attributes?.checkout_url
        const sessionId = data?.data?.id
        if (!checkoutUrl) {
            return NextResponse.json({ error: "Checkout URL not returned." }, { status: 500 })
        }

        return NextResponse.json({ url: checkoutUrl, id: sessionId })
    } catch (err) {
        console.error("Checkout session route error:", err)
        return NextResponse.json({ error: "Unexpected server error." }, { status: 500 })
    }
}

