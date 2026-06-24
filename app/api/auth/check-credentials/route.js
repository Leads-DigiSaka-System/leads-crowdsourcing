import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { identifier, password } = body || {}

        if (!identifier || !password) {
            return NextResponse.json({ validPassword: false }, { status: 400 })
        }

        const raw = String(identifier).trim()
        const ident = raw.toLowerCase()
        let user = null
        if (ident.includes("@")) {
            
            user = await prisma.user.findUnique({ where: { email: ident } })
        } else {
           
           
            try {
                user = await prisma.user.findFirst({ where: { username: { equals: raw, mode: 'insensitive' } } })
            } catch (err) {
               
                user = await prisma.user.findFirst({ where: { username: raw } })
            }
        }

        if (!user) {
            return NextResponse.json({ validPassword: false }, { status: 200 })
        }

      
        if (!user.password) {
            return NextResponse.json({ validPassword: false, isOAuthUser: true }, { status: 200 })
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return NextResponse.json({ validPassword: false }, { status: 200 })
        }

        const unverified = !user.emailVerified
        return NextResponse.json({ validPassword: true, unverified }, { status: 200 })
    } catch (e) {
        console.error("check-credentials error:", e)
        return NextResponse.json({ validPassword: false }, { status: 500 })
    }
}
