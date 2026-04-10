"use client";

import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClinicianBackNav() {
  const { user, isLoaded } = useAuth();

  if (!isLoaded || user?.role !== "clinician") return null;

  return (
    <Link
      href="/dashboard/clinician"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Clinician Dashboard
    </Link>
  );
}