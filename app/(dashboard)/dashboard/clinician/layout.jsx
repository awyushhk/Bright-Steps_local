"use client";

import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import ClinicianGuard from "./ClinicianGuard";

const NAV_LINKS = [
  { href: "/dashboard/clinician",                  label: "Cases"         },
  { href: "/dashboard/clinician/analytics",        label: "Analytics"     },
  { href: "/dashboard/clinician/therapy-overview", label: "Therapy"       },
  { href: "/dashboard/clinician/state-cases",      label: "State Cases"   },
  { href: "/dashboard/parent",                     label: "Screen a Child"},
];

export default function ClinicianDashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
                Clinician Dashboard
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop — Sign Out */}
          <div className="hidden md:flex items-center justify-end gap-3 flex-1">
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

          {/* Mobile — Hamburger only */}
          <div className="flex md:hidden items-center justify-end gap-3 flex-1">
            <button
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-1 border-t border-gray-100 mt-1">
              <button
                onClick={logout}
                className="w-full text-left flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <ClinicianGuard>{children}</ClinicianGuard>
      </main>
    </div>
  );
}