"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, GitCompare, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user previously chose dark mode
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Hide Navbar on landing/redirect page
  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-tr from-primary-violet to-primary-blue rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-text-primary group-hover:opacity-90 transition-opacity">
                Doc<span className="text-gradient">Analyzer</span>
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden md:flex items-center ml-10 space-x-1">
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/dashboard"
                    ? "bg-surface-hover text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Library
              </Link>
              <Link
                href="/compare"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/compare"
                    ? "bg-surface-hover text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Link>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2.5 rounded-xl text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-hover border transition-all duration-300"
              style={{ borderColor: "var(--color-border)" }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {mounted && (isDark ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary-violet" />
              ))}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
