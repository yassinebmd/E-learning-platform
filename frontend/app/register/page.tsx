"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerApi, RegisterData, UserRole } from "@/lib/api";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserPlus, Mail, Lock, User, Terminal } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    name: "",
    role: "STUDENT",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerApi(formData);
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-accent/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Terminal size={40} className="text-accent" />
          </div>
          <CardTitle className="text-2xl font-ibm-plex-mono text-accent">
            [ CREATE_ACCOUNT ]
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the Vulncore Cyber E-Learning Platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-ibm-plex-mono">
                /name
              </Label>
              <div className="flex items-center space-x-2">
                <User size={18} className="text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-transparent"
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="role" className="font-ibm-plex-mono">
                /role
              </Label>
              <Select onValueChange={handleRoleChange} defaultValue="STUDENT">
                <SelectTrigger className="w-full bg-transparent">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Executing..." : "Register"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm">
          <p className="w-full text-muted-foreground">
            Already have an account?
            <Link href="/login" className="text-accent hover:underline ml-1">
              Login Now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
