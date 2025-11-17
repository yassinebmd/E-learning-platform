// --- app/layout.tsx ---
// Hna fin kan7etto l fonts o l theme
import type { Metadata } from "next";
// Importi l fonts
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// Font 3adi l text
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

// Font "Terminal" l l headings (cyber style)
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Vulcore E-Learning",
  description: "Cyber Security Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 1. Hna kanforciw "dark" theme
        2. Kan'applikaw l fonts l body
      */}
      
      <body className={`dark ${inter.variable} ${ibmPlexMono.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}