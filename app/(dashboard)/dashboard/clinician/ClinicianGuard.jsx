"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClinicianGuard({ children }) {
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (user?.role !== "clinician") {
      router.replace("/dashboard/parent");
    }
  }, [isLoaded]);

  if (!isLoaded || user?.role !== "clinician") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}