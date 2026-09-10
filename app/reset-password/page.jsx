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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  // token validity is checked in the child component that reads search params

  const onSubmit = async ({ password }, token) => {
    if (!token) {
      toast.error("Missing reset token.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Password updated. Please sign in.");
        router.push("/login");
        router.refresh();
      } else {
        toast.error(data?.message || "Unable to reset password.");
      }
    } catch {
      toast.error("Something went wrong.");
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

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <Card className="w-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">
                Reset password
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Enter a new password
              </CardDescription>
            </CardHeader>
            <Suspense fallback={<CardContent><p>Loading reset form…</p></CardContent>}>
              <TokenGate
                form={form}
                isLoading={isLoading}
                onSubmit={onSubmit}
              />
            </Suspense>
          </Card>
        </div>
      </div>
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Secured by NextAuth.js • Protected with JWT</p>
      </div>
    </div>
  );
}

function TokenGate({ form, isLoading, onSubmit }) {
  const search = useSearchParams();
  const token = search?.get("t") || "";
  const [attempt, setAttempt] = useState(0);
  const [validation, setValidation] = useState(null);
  const status = !token
    ? "invalid"
    : validation?.token === token && validation?.attempt === attempt
      ? validation.status
      : "checking";

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    async function check() {
      try {
        const res = await fetch(
          `/api/auth/reset-token-status?t=${encodeURIComponent(token)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (controller.signal.aborted) return;
        setValidation({
          token,
          attempt,
          status: res.ok
            ? "valid"
            : res.status === 400 || res.status === 404
              ? "invalid"
              : "error",
        });
      } catch {
        if (!controller.signal.aborted) {
          setValidation({ token, attempt, status: "error" });
        }
      }
    }
    check();
    return () => controller.abort();
  }, [token, attempt]);

  if (status === "checking") {
    return (
      <CardContent>
        <p className="text-sm text-muted-foreground" role="status">
          Checking your reset link...
        </p>
      </CardContent>
    );
  }

  if (status === "invalid") {
    return (
      <CardContent className="space-y-4">
        <p className="text-sm text-red-700" role="alert">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <Button asChild className="w-full h-12 font-medium rounded-lg">
          <Link href="/forgot-password">Request a new reset link</Link>
        </Button>
      </CardContent>
    );
  }

  if (status === "error") {
    return (
      <CardContent className="space-y-4">
        <p className="text-sm text-red-700" role="alert">
          We could not check your reset link. Please try again.
        </p>
        <Button
          type="button"
          className="w-full h-12 font-medium rounded-lg"
          onClick={() => setAttempt((current) => current + 1)}
        >
          Try again
        </Button>
      </CardContent>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (status === "valid" && !isLoading) return onSubmit(values, token);
        })}
      >
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 font-medium rounded-lg"
            disabled={isLoading || status !== "valid"}
          >
            {isLoading ? "Updating..." : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
