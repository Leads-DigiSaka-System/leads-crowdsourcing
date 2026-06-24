import { NextResponse } from "next/server"

export async function POST(req) {
    try {
        const { title, amount } = await req.json()
        // Validate input
        if (!title || !amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid input." }, { status: 400 })
        }

        // Prepare PayMongo API call
        const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY
        const url = "https://api.paymongo.com/v1/links"
        const payload = {
            data: {
                attributes: {
                    send_email_receipt: true,
                    amount: Math.round(Number(amount) * 100), // PayMongo expects centavos
                    description: `Backing project: ${title}`,
                    currency: "PHP",
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
        if (data?.data?.attributes?.checkout_url) {
            return NextResponse.json({ url: data.data.attributes.checkout_url })
        } else {
            return NextResponse.json({ error: "Failed to create payment link." }, { status: 500 })
        }
    } catch (e) {
        return NextResponse.json({ error: "Server error." }, { status: 500 })
    }
}
