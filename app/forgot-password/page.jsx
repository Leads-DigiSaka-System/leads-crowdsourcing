"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.message("Check your email", {
          description:
            data?.message ||
            `We sent a password reset link to ${data?.maskedEmail || "your email"}.`,
        });
        router.push("/login");
        router.refresh();
      } else {
        if (data?.code === "GOOGLE_ONLY") {
          toast.error(
            "This account uses Google sign-in. Please continue with Google."
          );
        } else if (data?.code === "TOKEN_ACTIVE") {
          toast.message("Reset link already sent", {
            description: "Please check your email for the reset link.",
          });
        } else {
          toast.error(
            data?.message || "Unable to process request. Please try again."
          );
        }
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
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

      {/* Centered form card (mirror login page structure) */}
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <Card className="w-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">
                Forgot password
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Enter your email to receive a reset link
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Remembered your password?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline"
                    >
                      Back to login
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Secured by NextAuth.js • Protected with JWT</p>
      </div>
    </div>
  );
}
