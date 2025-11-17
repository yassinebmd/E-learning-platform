"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginData } from "@/lib/api";

import { useAuth } from "@/context/AuthContext";

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
import { Mail, Lock, Terminal } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(formData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Had l background fih chwiya style (dots) */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_rgba(0,128,255,0.2)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-accent/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Terminal size={40} className="text-accent" />
          </div>
          <CardTitle className="text-2xl font-ibm-plex-mono text-accent">
            [ AUTHENTICATE ]
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Access your Vulcore Cyber account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-ibm-plex-mono">
                /email
              </Label>
              <div className="flex items-center space-x-2">
                <Mail size={18} className="text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-ibm-plex-mono">
                /password
              </Label>
              <div className="flex items-center space-x-2">
                <Lock size={18} className="text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Your Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-transparent"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-ibm-plex-mono text-center">
                {`> Error: ${error}`}
              </p>
            )}

            <Button
              type="submit"
              className="w-full font-bold bg-accent text-background hover:bg-accent/80"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm">
          <p className="w-full text-muted-foreground">
            No account yet?
            <Link href="/register" className="text-accent hover:underline ml-1">
              Register Now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
