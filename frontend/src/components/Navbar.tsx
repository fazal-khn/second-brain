"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LogOut, LayoutDashboard, GitCompare, HardDrive } from "lucide-react";
import { authAPI } from "@/lib/api";
import { User } from "@/lib/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Don't fetch user on landing/login page
    if (pathname === "/") return;
    
    authAPI.me()
      .then((data) => setUser(data))
      .catch(() => {
        // Redirect to login if me query fails on protected pages
        router.push("/");
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      // Hard redirect as fallback
      window.location.href = "/";
    }
  };

  // Hide Navbar on login/landing screen
  if (pathname === "/") return null;

  const storagePercentage = user ? Math.min(100, (user.storage_used_mb / 500) * 100) : 0;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 text-white group">
              <div className="p-2 bg-gradient-to-tr from-primary-violet to-primary-blue rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight group-hover:opacity-90 transition-opacity">
                Doc<span className="text-gradient">Analyzer</span>
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden md:flex items-center ml-10 space-x-1">
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/dashboard"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Library
              </Link>
              <Link
                href="/compare"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/compare"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Link>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden lg:flex flex-col items-end space-y-1">
                <span className="text-xs font-semibold text-neutral-300">{user.full_name}</span>
                {/* Storage progress bar */}
                <div className="flex items-center space-x-2 text-xs text-neutral-400">
                  <HardDrive className="h-3 w-3" />
                  <span>{user.storage_used_mb.toFixed(1)} MB / 500 MB</span>
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-violet to-primary-blue"
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 border border-neutral-800 hover:border-red-950/30 transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
