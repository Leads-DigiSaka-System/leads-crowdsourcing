"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const authErrorMessages = new Map([
  ["OAuthAccountNotLinked", "This email already has an account. Sign in with your password, or try a different Google account."],
  ["AccessDenied", "Google sign-in was cancelled or access was denied. Please try again."],
  ["Configuration", "Google sign-in is currently unavailable. Please use your password or contact support."],
]);

export function LoginForm({
  callbackUrl = "/admin",
  onSuccess,
  compact = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const authError = searchParams?.get("error");
  const oauthError = authError
    ? (authErrorMessages.get(authError) || "Sign-in could not be completed. Please try again.")
    : "";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values) => {
    setServerError("");
    try {
      // First, check credentials to distinguish wrong password vs unverified
      const check = await fetch("/api/auth/check-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: values.username,
          password: values.password,
        }),
      });
      const checkData = await check.json().catch(() => ({}));
      if (!check.ok) {
        setServerError("Unable to sign in right now. Please try again.");
        return;
      }

      if (!checkData.validPassword) {
        if (checkData.isOAuthUser) {
          toast.error("Please use 'Continue with Google' to sign in");
          setServerError(
            "This account was created with Google. Please use 'Continue with Google' button below to sign in."
          );
        } else {
          toast.error("Incorrect username or password");
          setServerError("Incorrect username or password");
        }
        return;
      }

      if (checkData.unverified) {
        // Start verification flow
        try {
          const resp = await fetch("/api/auth/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: values.username }),
          });
          if (resp.ok) {
            const data = await resp.json();
            const params = new URLSearchParams();
            if (data?.verifyToken) params.set("t", data.verifyToken);
            if (data?.maskedEmail) params.set("m", data.maskedEmail);
            toast.message("Verification required", {
              description: "We sent you a 6-digit code.",
            });
            router.push(`/verify?${params.toString()}`);
            return;
          }
        } catch (_) {}
        setServerError("Your email is not verified yet. Please try again.");
        return;
      }

      // If credentials are correct and verified, proceed to sign in
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid credentials. Please try again.");
      } else {
        toast.success("Signed in successfully");
        if (onSuccess) {
          onSuccess(); // Call the callback if provided
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (error) {
      setServerError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <Card
        className={`border-0 ${compact ? "shadow-none bg-transparent" : "shadow-2xl bg-white/80 backdrop-blur-sm"}`}
      >
        {!compact && (
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className={compact ? "space-y-2 p-0" : "space-y-6"}>
              {(serverError || oauthError) && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertDescription className="text-red-800">
                    {serverError || oauthError}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className={compact ? "space-y-1" : ""}>
                    <FormLabel>Username or Email</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <FormControl>
                        <Input
                          placeholder="Enter your username or email"
                          {...field}
                          disabled={isLoading}
                          className={`pl-10 border-input ${compact ? "h-9" : "h-12"}`}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                    {serverError?.toLowerCase().includes("not verified") && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Didn’t get the code? After trying again we’ll send a new
                        one and redirect you to the verify page.
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className={compact ? "space-y-1" : ""}>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                          className={`pl-10 pr-10 border-gray-200 ${compact ? "h-9" : "h-12"}`}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                    {!compact && (
                      <div className="mt-2 text-xs text-muted-foreground text-right">
                        <Link
                          href="/forgot-password"
                          className="hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* <div className="bg-muted border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Demo Credentials</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Username:</span> admin
                      </div>
                      <div>
                        <span className="font-medium">Password:</span> admin123
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </CardContent>

            <CardFooter
              className={`${compact ? "mt-4 pt-2 p-0" : "pt-4"} flex flex-col ${compact ? "gap-2" : "gap-3"}`}
            >
              <Button
                type="submit"
                className={`w-full font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${compact ? "h-9" : "h-12"}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className={`mr-2 animate-spin ${compact ? "h-4 w-4" : "h-5 w-5"}`}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock
                      className={`mr-2 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
                    />
                    Sign In
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className={`w-full ${compact ? "h-9" : "h-12"}`}
                disabled={googleLoading || isLoading}
                onClick={async () => {
                  try {
                    setServerError("");
                    setGoogleLoading(true);
                    await signIn("google", { redirectTo: callbackUrl }, { prompt: "select_account" });
                  } catch (e) {
                    setGoogleLoading(false);
                    toast.error("Google sign-in failed");
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className={compact ? "w-4 h-4" : "w-5 h-5"}
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.153,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.153,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.191l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.084,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                {googleLoading
                  ? "Redirecting..."
                  : "Continue with Google"}
              </Button>

              <p
                className={`text-muted-foreground text-center ${compact ? "text-xs mt-2" : "text-sm"}`}
              >
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {!compact && (
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secured by NextAuth.js • Protected with JWT</p>
        </div>
      )}
    </div>
  );
}
