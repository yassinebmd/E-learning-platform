"use client";

import Link from "next/link";
import { Shield, Github, Twitter, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-t from-black to-[#0a0a0c] border-t border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Shield className="text-blue-500" size={32} />
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                VulnCore
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Advanced cybersecurity e-learning platform for professionals.
              Master the latest techniques and methodologies in ethical hacking,
              penetration testing, and security research.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
                >
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  All Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
                >
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
                >
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Connect</h3>
            <div className="space-y-3">
              <a
                href="mailto:contact@vulncore.com"
                className="flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Mail size={16} />
                contact@vulncore.com
              </a>
              <a
                href="https://twitter.com/vulncore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Twitter size={16} />
                @vulncore
              </a>
              <a
                href="https://github.com/vulncore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Github size={16} />
                GitHub
              </a>
              <a
                href="https://vulncore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors text-sm"
              >
                <Globe size={16} />
                vulncore.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-900/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} VulnCore. All rights reserved.
              <span className="hidden md:inline"> • </span>
              <br className="md:hidden" />
              Security through knowledge.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
