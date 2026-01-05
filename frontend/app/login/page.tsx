"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);
    setAttemptsLeft(null);
    setLockedUntil(null);

    try {
      await login({ email, password });
      setSuccess(true);
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.locked) {
        setLockedUntil(err.lockoutUntil || "20 minutes");
      }
      if (err.attemptsLeft !== undefined) {
        setAttemptsLeft(err.attemptsLeft);
      }

      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07070a] to-black flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,#94a3b8_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <Card className="w-full max-w-md z-10 bg-gradient-to-b from-slate-900/40 to-black/30 backdrop-blur-sm border border-slate-800/70">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Login
          </CardTitle>
          <CardDescription className="text-slate-400">
            Secure access to your cybersecurity training
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle size={48} className="text-emerald-500" />
              <div className="text-center">
                <p className="text-emerald-400 font-semibold mb-2">
                  Login Successful!
                </p>
                <p className="text-slate-400 text-sm">
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-300 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-slate-300 font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {lockedUntil && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                  <p className="text-red-300 text-sm text-center">
                    🔒 Account locked. Please try again later.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      size={16}
                      className="text-red-400 flex-shrink-0"
                    />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || lockedUntil !== null}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : lockedUntil ? (
                  "Account Locked"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-6 border-t border-slate-800/50">
          <p className="text-slate-400 text-sm text-center">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Create Account
            </Link>
          </p>

          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>
              ⚠️ After 5 failed attempts, account will be locked for 20 minutes
            </p>
            <p>🔐 Contact support if you're locked out</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
