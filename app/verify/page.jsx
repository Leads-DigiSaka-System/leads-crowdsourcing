"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyClient />
    </Suspense>
  );
}

function VerifyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-muted-foreground">
      Loading verification…
    </div>
  );
}

function VerifyClient() {
  const search = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds

  useEffect(() => {
    const vt = search.get("t");
    const masked = search.get("m");
    if (vt) setVerifyToken(vt);
    if (masked) setEmailMasked(masked);
  }, [search]);

  // countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyToken, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Verification failed");
      }

      const data = await res.json();
      toast.success("Email verified! Signing you in…");

      // Secure token-based auto-login
      if (data.email && data.loginToken) {
        const result = await signIn("credentials", {
          email: data.email,
          token: data.loginToken,
          redirect: true,
          callbackUrl: "/",
        });
        // If signIn didn't redirect (redirect: true should), fall back
        if (result?.error) {
          router.push("/login?verified=1");
          return;
        }
        return;
      }

      // Fallback: go home and let user sign in
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verifyToken) {
      toast.error("Missing verification session. Try logging in again.");
      return;
    }
    try {
      setResendLoading(true);
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to resend code");
      setVerifyToken(data.verifyToken);
      if (data?.maskedEmail) setEmailMasked(data.maskedEmail);
      toast.success("New code sent");
      setCooldown(60);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo and name (same as login) */}
      <div className="w-full flex items-center h-16 px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center transition-transform duration-200 pt-4"
        >
          <div className="relative p-1">
            <Image
              src={"/researchbayanihan_logo.svg"}
              width={64}
              height={64}
              alt="IMPACT R&D logo"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm xl:text-base text-foreground tracking-tight leading-tight">
              <span className="text-primary">IMPACT </span>R&D
            </span>
            <span className="font-bold  tracking-wider leading-tight">
              Research<span className="text-primary">Bayanihan</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Centered verify card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent
              {emailMasked ? ` to ${emailMasked}` : " to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground text-center -mt-2">
              Tip: You can paste the whole code and we’ll spread it across the
              boxes.
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                autoFocus
                pattern={/^[0-9]+$/}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6 && !loading) {
                    handleVerify();
                  }
                }}
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-12 text-xl rounded-lg bg-white/95 border border-muted shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleVerify}
                disabled={loading || !verifyToken}
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying…
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                title={cooldown > 0 ? `Wait ${cooldown}s` : undefined}
              >
                {resendLoading
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend"}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Wrong email?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Try a different account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
