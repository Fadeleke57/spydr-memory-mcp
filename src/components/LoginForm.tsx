import React, { useState } from "react";
import { useStytch } from "@stytch/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const defaultOnLoginComplete = (
  redirectTo: string = "/home?src=mcp_auth_complete"
) => {
  window.location.href = redirectTo;
};

export const googleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export function CustomLoginForm() {
  const stytchClient = useStytch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    stytchClient.oauth.google.start({
      login_redirect_url: window.location.origin + "/authenticate",
      signup_redirect_url: window.location.origin + "/authenticate",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await stytchClient.passwords.authenticate({
        email,
        password,
        session_duration_minutes: 60,
      });
      if (response.session) {
        defaultOnLoginComplete();
      }
    } catch (err: any) {
      setError(
        err.error_message || "An unexpected error occurred. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-1/2 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full rounded-md">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center justify-center mb-2">
            <img
              src={"/slogonobg.png"}
              className="w-14 h-14 mb-3 rotate-45"
              alt={"Logo"}
            />
            <CardTitle className="text-xl">
              Connect your Spydr Account
            </CardTitle>
            <CardDescription className="mt-1 mb-6">
              Please sign in to connect to an external source
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
            >
              {googleIcon}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[hsl(var(--background))] dark:bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] px-2">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                className="text-[hsl(var(--muted-foreground))]"
                htmlFor="email"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="transition-all duration-200 ease-in-out"
              />
            </div>

            <div className="space-y-2">
              <Label
                className="text-[hsl(var(--muted-foreground))]"
                htmlFor="password"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="transition-all duration-200 ease-in-out"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center px-1">
                {error.substring(0, 1).toLocaleUpperCase() +
                  error.substring(1).toLowerCase()}
              </p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="pt-2 text-xs text-center text-[hsl(var(--muted-foreground))]">
              By continuing, you agree to our{" "}
              <a
                href="https://www.spydr.dev/about/terms-of-service"
                target="_blank"
                className="underline hover:text-[hsl(var(--primary))]"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="https://www.spydr.dev/about/privacy-policy"
                target="_blank"
                className="underline hover:text-[hsl(var(--primary))]"
              >
                Privacy Policy
              </a>
              .
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
