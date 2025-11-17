"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, TerminalSquare, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  const sectionStyle = "py-20 animate-fade-in";
  const sectionTitleStyle = "text-3xl font-bold font-ibm-plex-mono text-center";
  const sectionDescriptionStyle =
    "mt-4 text-lg text-muted-foreground text-center max-w-2xl mx-auto";

  return (
    <div className="bg-background text-foreground">
      <header className="relative flex flex-col items-center justify-center min-h-[calc(100vh-65px)] text-center p-8 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-15">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent rounded-full blur-[200px] animate-pulse"></div>
        </div>

        <div className="z-10 animate-fade-in">
          <h1 className="mt-6 text-5xl md:text-7xl font-bold font-ibm-plex-mono">
            Master Cyber Security
          </h1>

          <div className="flex justify-center mt-4">
            <p className="text-2xl text-muted-foreground animate-typing w-[22ch]">
              $ Learn. Hack. Secure.
            </p>
          </div>

          <p className="mt-6 text-lg max-w-xl mx-auto text-muted-foreground">
            Your journey into offensive and defensive security starts here.
            Access hands-on labs, expert-led courses, and a real-world hacking
            environment.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {!loading && !isAuthenticated && (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-background font-bold hover:bg-accent/80"
                >
                  <Link href="/register">
                    Start Hacking (Register)
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
            {!loading && isAuthenticated && (
              <Button
                asChild
                size="lg"
                className="bg-accent text-background font-bold hover:bg-accent/80"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className={sectionStyle} style={{ animationDelay: "500ms" }}>
        <div className="container mx-auto">
          <h2 className={sectionTitleStyle}>[ PLATFORM_FEATURES ]</h2>
          <p className={sectionDescriptionStyle}>
            Why Vulcore is the right choice for your cyber career.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border/20">
              <CardHeader>
                <TerminalSquare size={40} className="text-accent mb-4" />
                <CardTitle className="font-ibm-plex-mono">
                  Real-World Labs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Don't just read. Get your hands dirty in fully configured,
                  vulnerable environments.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/20">
              <CardHeader>
                <Zap size={40} className="text-accent mb-4" />
                <CardTitle className="font-ibm-plex-mono">
                  Expert-Led Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn from industry professionals who have been in the
                  trenches of cyber warfare.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/20">
              <CardHeader>
                <Shield size={40} className="text-accent mb-4" />
                <CardTitle className="font-ibm-plex-mono">
                  Career Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Follow structured learning paths designed to take you from
                  zero to bug bounty hero.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className={sectionStyle} style={{ animationDelay: "1000ms" }}>
        <div className="container mx-auto">
          <h2 className={sectionTitleStyle}>[ FEATURED_COURSES ]</h2>
          <p className={sectionDescriptionStyle}>
            A glimpse into our arsenal. Start learning these modules today.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/20 hover:border-accent/50 transition-colors">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">
                  Beginner
                </Badge>
                <CardTitle>Network Pentesting 101</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn Nmap, Wireshark, and Metasploit basics.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/20 hover:border-accent/50 transition-colors">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">
                  Intermediate
                </Badge>
                <CardTitle>Web App Exploitation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Master SQL Injection, XSS, and CSRF attacks.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/20 hover:border-accent/50 transition-colors">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">
                  Advanced
                </Badge>
                <CardTitle>Malware Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reverse engineer and analyze real-world malware.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/courses">
                View All Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
