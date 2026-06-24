import { sendVerificationCodeEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { createOrReplaceVerificationCode, createVerificationSession, maskEmail } from "@/lib/verification"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const body = await request.json()
        const { name, email, username, password } = body || {}

        // Basic validation
        if (!name || !email || !username || !password) {
            return NextResponse.json(
                { message: "Full name, email, username and password are required." },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters." },
                { status: 400 }
            )
        }

        // Normalize
        const normalizedEmail = String(email).toLowerCase().trim()
        const normalizedUsername = String(username).toLowerCase().trim()

        // Ensure unique email and username
        const [existingEmail, existingUsername] = await Promise.all([
            prisma.user.findUnique({ where: { email: normalizedEmail } }),
            prisma.user.findUnique({ where: { username: normalizedUsername } }),
        ])

        if (existingEmail) {
            return NextResponse.json(
                { message: "Email already in use." },
                { status: 409 }
            )
        }

        if (existingUsername) {
            return NextResponse.json(
                { message: "Username already taken." },
                { status: 409 }
            )
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10)

        // Create user with default role 'user'
        const user = await prisma.user.create({
            data: {
                name: name || null,
                email: normalizedEmail,
                username: normalizedUsername,
                password: hashed,
                role: "user",
                image: null,
            },
            select: { id: true, email: true, username: true, role: true, name: true },
        })

        // Send verification code and create session
        const { code, expiresAt } = await createOrReplaceVerificationCode(user.email)
        const { token } = await createVerificationSession(user.email)
        const masked = maskEmail(user.email)
        await sendVerificationCodeEmail({ to: user.email, code, expiresMinutes: 120, maskedEmail: masked })

        return NextResponse.json({ user, verify: { token, maskedEmail: masked, expiresAt } }, { status: 201 })
    } catch (err) {
        console.error("Register error:", err)
        return NextResponse.json(
            { message: "Unexpected error. Please try again." },
            { status: 500 }
        )
    }
}
