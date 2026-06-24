import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import RegisterForm from "@/components/login/register-form"

export default async function RegisterPage() {
    const session = await auth()

    // If logged in, redirect via client (keep SSR simple)
    if (session) {
        // No redirect here to avoid server-side redirect loops with NextAuth pages
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="w-full flex items-center h-16 px-6 lg:px-8">
                <Link href="/" className="flex items-center transition-transform duration-200 pt-4">
                    <div className="relative p-1">
                        <Image src={'/researchbayanihan_logo.svg'} width={64} height={64} alt="IMPACT R&D logo" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm xl:text-base text-foreground tracking-tight leading-tight">
                            <span className="text-primary">IMPACT </span>R&D
                        </span>
                        <span className="font-bold  tracking-wider leading-tight">
                            Research<span className='text-primary'>Bayanihan</span>
                        </span>
                    </div>
                </Link>
            </div>

            {/* Main */}
            <div className="flex flex-1 items-center justify-center">
                <div className="max-w-md w-full space-y-8 p-8">
                    <RegisterForm />
                </div>
            </div>
        </div>
    )
}
