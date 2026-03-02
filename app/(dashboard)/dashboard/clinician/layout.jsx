"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import ClinicianGuard from "./ClinicianGuard";

const NAV_LINKS = [
  { href: "/dashboard/clinician",           label: "Cases"     },
  { href: "/dashboard/clinician/analytics", label: "Analytics" },
  { href: "/dashboard/clinician/therapy-overview", label: "Therapy"  },
  { href: "/dashboard/parent",              label: "Screen a Child"  },
];

export default function ClinicianDashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

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

          {/* Right side */}
          <div className="flex items-center justify-end gap-3 flex-1">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{ elements: { avatarBox: "h-9 w-9" } }}
            />
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
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
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <ClinicianGuard>{children}</ClinicianGuard>
      </main>
    </div>
  );
}