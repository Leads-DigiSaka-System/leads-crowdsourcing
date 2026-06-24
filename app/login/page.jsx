
import { auth } from "@/auth"
import { LoginForm } from "@/components/login/login-form"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function LoginPage({ searchParams }) {
  const session = await auth();
  const params = await searchParams;

  // Redirect if already logged in
  if (session) {
    if (session.user.role === 'admin') {
      redirect("/admin/dashboard");
    } else {
      redirect("/");
    }
  }

  const callbackUrl = params?.callbackUrl || "/";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo and company name in a responsive flex row at the top */}
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

      {/* Centered login form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  )
}
