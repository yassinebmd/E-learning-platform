"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 
import { Button } from "@/components/ui/button";
import { Terminal, Loader2, LogOut } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, loading, logout, user } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 px-8 border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <Terminal size={28} className="text-accent" />
        <span className="text-xl font-bold font-ibm-plex-mono text-primary">
          Vulcore E-Learning
        </span>
      </Link>

      <div className="hidden md:flex gap-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Home
        </Link>
        <Link
          href="/courses"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Courses
        </Link>
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {loading && (
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        )}

        {!loading && isAuthenticated && user && (
          <>
            <span className="text-sm text-muted-foreground">
              {`> ${user.name}`}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </>
        )}

        {!loading && !isAuthenticated && (
          <>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button
              className="bg-accent text-background hover:bg-accent/80"
              asChild
            >
              <Link href="/register">Register</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
