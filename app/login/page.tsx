"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.roles?.length) {
      // OPTION 1: Always redirect to /super (default behavior)
      router.replace("/super");

      // OPTION 2: Redirect based on first matching role (optional alternative)
      /*
      const roleRedirects: Record<string, string> = {
        super: "/super",
        admin: "/admin",
        manager: "/manager",
        user: "/user",
      };

      const redirectPath = session.user.roles.find((role) => roleRedirects[role]);
      if (redirectPath) {
        router.replace(roleRedirects[redirectPath]);
      }
      */
    }
  }, [session, status, router]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (res?.ok) {
      // Will trigger session reload and redirect via useEffect
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-md dark:shadow-lg rounded-2xl p-8 space-y-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
          PRTCMS
        </h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="dark:text-gray-300">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </div>
    </main>
  );
}
