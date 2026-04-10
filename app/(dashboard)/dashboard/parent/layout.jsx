"use client";

import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import { Brain } from "lucide-react";
import ClinicianBackNav from "./ClinicianBackNav";

export default function DashboardLayout({ children }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-1">
            <Brain className="h-8 w-8 text-indigo-600" />
            <div className="flex flex-col leading-tight">
              <Link href="/" className="text-2xl md:text-3xl font-extrabold tracking-tight">
                <span className="text-indigo-600">Bright</span>
                <span className="font-extrabold ml-2">Steps</span>
              </Link>
              <span className="text-xs md:text-sm text-slate-400 tracking-wide">
                Parent Dashboard
              </span>
            </div>
          </div>

          {/* Only renders for clinician role, invisible to parents */}
          <ClinicianBackNav />

          {/* Sign Out */}
          <div className="flex items-center justify-end flex-1">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}