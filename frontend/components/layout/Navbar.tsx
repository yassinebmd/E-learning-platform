"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  Loader2,
  LogOut,
  BookOpen,
  GraduationCap,
  Menu,
  X,
  Home,
  User,
  Settings,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    ...(isStudent
      ? [
          {
            href: "/courses",
            label: "All Courses",
            icon: <BookOpen size={18} />,
          },
          {
            href: "/dashboard",
            label: "My Enrollments",
            icon: <GraduationCap size={18} />,
          },
        ]
      : []),
    ...(isInstructor
      ? [
          {
            href: "/dashboard/instructor/courses",
            label: "Manage Courses",
            icon: <BookOpen size={18} />,
          },
        ]
      : []),
  ];

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-lg"
            : "bg-background/90 backdrop-blur-sm border-b border-border/20"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Terminal
                  size={28}
                  className="text-accent group-hover:scale-110 transition-transform"
                />
                <div className="absolute -inset-1 bg-accent/10 rounded-full blur-sm group-hover:bg-accent/20 transition-colors" />
              </div>
              <span className="text-xl font-bold font-ibm-plex-mono text-primary hidden sm:block">
                VulnCore
              </span>
              <span className="text-xl font-bold font-ibm-plex-mono text-primary sm:hidden">
                VC
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-accent/5"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                {loading && (
                  <Loader2
                    size={20}
                    className="animate-spin text-muted-foreground"
                  />
                )}

                {!loading && isAuthenticated && user && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-sm font-medium text-primary">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              user.role === "INSTRUCTOR"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="hidden lg:flex items-center gap-2 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <LogOut size={16} />
                      Logout
                    </Button>
                  </>
                )}

                {!loading && !isAuthenticated && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      asChild
                      className="hidden sm:inline-flex"
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                      asChild
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {!loading && isAuthenticated && user && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium mr-2">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/5 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X size={24} className="text-primary" />
                ) : (
                  <Menu size={24} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Terminal size={28} className="text-accent" />
                    <span className="text-xl font-bold font-ibm-plex-mono text-primary">
                      VulnCore
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-accent/10"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                {!loading && isAuthenticated && user && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-primary">{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.role === "INSTRUCTOR"
                              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-1">
                  <Link
                    href="/"
                    className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/5 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home size={20} />
                    Home
                  </Link>

                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/5 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}

                  {!loading && isAuthenticated && (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/5 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User size={20} />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/5 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings size={20} />
                        Settings
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border space-y-3">
                {!loading && isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut size={18} />
                      Logout
                    </Button>
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      Signed in as {user?.email}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
