"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  Activity,
  ChevronRight,
  Flame,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import TherapyAlertsPanel from "../components/TherapyAlertsPanel";


// ── Skeletons ──────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
}

function CaseSkeleton() {
  return (
    <Card className="rounded-2xl border-l-4 border-l-gray-200">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getRiskConfig(level) {
  switch (level) {
    case "high":
      return {
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        borderL: "border-l-rose-500",
      };
    case "medium":
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
        borderL: "border-l-amber-400",
      };
    case "low":
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        borderL: "border-l-emerald-400",
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-500 border-gray-200",
        dot: "bg-gray-400",
        borderL: "border-l-gray-300",
      };
  }
}

function StatusPill({ status }) {
  const map = {
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-violet-100 text-violet-700",
    reviewed: "bg-gray-100 text-gray-600",
    actioned: "bg-emerald-100 text-emerald-700",
  };
  const labels = {
    submitted: "New",
    under_review: "Reviewing",
    reviewed: "Reviewed",
    actioned: "Actioned",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ClinicianDashboard() {
  const { user, isLoaded } = useAuth();
  const router = useRouter();

  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    loadScreenings();
  }, [isLoaded]);

  async function loadScreenings() {
    setLoading(true);
    try {
      const res = await fetch("/api/screenings?all=true");
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Sort all by date newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Keep only latest screening per child
      const seen = new Set();
      const latest = data.filter((s) => {
        if (seen.has(s.childId)) return false;
        seen.add(s.childId);
        return true;
      });

      // Then sort by risk level
      const order = { high: 3, medium: 2, low: 1 };
      latest.sort((a, b) => {
        const aR = order[a.riskAssessment?.level] ?? 0;
        const bR = order[b.riskAssessment?.level] ?? 0;
        return bR - aR;
      });

      setScreenings(latest);
    } catch {
      toast.error("Failed to load screenings");
    } finally {
      setLoading(false);
    }
  }

  async function markUnderReview(screeningId) {
    setUpdatingId(screeningId);
    try {
      const res = await fetch(`/api/screenings/${screeningId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "under_review" }),
      });
      if (!res.ok) throw new Error();
      setScreenings((prev) =>
        prev.map((s) =>
          s.id === screeningId ? { ...s, status: "under_review" } : s,
        ),
      );
      toast.success("Marked as under review");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = {
    total: screenings.length,
    pending: screenings.filter((s) =>
      ["submitted", "under_review"].includes(s.status),
    ).length,
    highRisk: screenings.filter((s) => s.riskAssessment?.level === "high")
      .length,
    actioned: screenings.filter((s) => s.status === "actioned").length,
  };

  const filtered = screenings.filter((s) => {
    const tabMatch =
      activeTab === "all"
        ? true
        : activeTab === "pending"
          ? ["submitted", "under_review"].includes(s.status)
          : activeTab === "high-risk"
            ? s.riskAssessment?.level === "high"
            : activeTab === "reviewed"
              ? ["reviewed", "actioned"].includes(s.status)
              : true;

    const q = searchQuery.toLowerCase();
    const searchMatch =
      !q ||
      s.id?.toLowerCase().includes(q) ||
      s.childName?.toLowerCase().includes(q);

    return tabMatch && searchMatch;
  });

  const doctorName = user?.name || user?.email?.split("@")[0];

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-violet-300" />
              <span className="text-slate-300 text-xs font-semibold tracking-widest uppercase">
                Clinician
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Dr. {doctorName}
            </h1>
            <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
              Review cases, prioritize high-risk children, and record clinical
              decisions.
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center flex-shrink-0">
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Cases",    value: stats.total,    icon: ClipboardList, color: "text-white"       },
            { label: "Pending Review", value: stats.pending,  icon: Clock,         color: "text-amber-300"   },
            { label: "High Risk",      value: stats.highRisk, icon: Flame,         color: "text-rose-300"    },
            { label: "Actioned",       value: stats.actioned, icon: CheckCircle,   color: "text-emerald-300" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <div className="text-xl font-bold leading-none">
                  {loading ? "—" : value}
                </div>
                <div className="text-slate-300 text-xs mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Analytics ── */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or case ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 gap-2 flex-shrink-0"
          onClick={() => router.push("/dashboard/clinician/analytics")}
        >
          <TrendingUp className="h-4 w-4" />
          Analytics
        </Button>
      </div>

      {/* ── Therapy Alerts ── */}
      <TherapyAlertsPanel />

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl bg-gray-100 p-1 gap-1">
          <TabsTrigger value="pending" className="rounded-lg text-sm">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="high-risk" className="rounded-lg text-sm">
            🔴 High Risk ({stats.highRisk})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="rounded-lg text-sm">
            Reviewed
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-sm">
            All ({stats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {/* Loading */}
          {loading && (
            <>
              <CaseSkeleton />
              <CaseSkeleton />
              <CaseSkeleton />
            </>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <Card className="border-2 border-dashed border-gray-200 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-700 mb-1">No cases found</h3>
                <p className="text-gray-400 text-sm">
                  {searchQuery ? "Try a different search" : "No cases in this category yet"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Case cards */}
          {!loading &&
            filtered.map((screening) => {
              const risk = getRiskConfig(screening.riskAssessment?.level);
              const hasVideos = screening.videos?.length > 0;

              return (
                <Card
                  key={screening.id}
                  className={`border-l-4 ${risk.borderL} rounded-2xl hover:shadow-md transition-shadow duration-200`}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {screening.childName || "Unknown"}
                          </h3>
                          <p className="text-gray-400 text-xs font-mono">
                            #{screening.id?.replace("screening-", "").slice(0, 8).toUpperCase()}
                            {screening.childDob && (
                              <span className="font-sans ml-2 text-gray-400">
                                • DOB: {new Date(screening.childDob).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                          <StatusPill status={screening.status} />
                        </div>
                        <p className="text-gray-400 text-xs">
                          {screening.submittedAt || screening.createdAt
                            ? formatDate(screening.submittedAt ?? screening.createdAt)
                            : "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${risk.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                          {(screening.riskAssessment?.level ?? "unknown").toUpperCase()} RISK
                        </span>
                        {screening.riskAssessment?.combinedScore != null && (
                          <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-xl">
                            {screening.riskAssessment.combinedScore}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Q Score",     value: screening.questionnaireScore != null ? `${screening.questionnaireScore}/15` : "—" },
                        { label: "Responses",   value: `${screening.questionnaireResponses?.length ?? 0} answered` },
                        { label: "Videos",      value: hasVideos ? `${screening.videos.length} uploaded` : "None" },
                        { label: "AI Analysis", value: screening.riskAssessment?.videoIndicators ? "✓ Available" : "Q-only" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                          <p className="font-semibold text-gray-800 text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* AI Summary */}
                    {screening.riskAssessment?.explanation && (
                      <div className="mb-4 p-3 rounded-xl bg-violet-50 border border-violet-100">
                        <p className="text-xs font-semibold text-violet-600 mb-1">AI Summary</p>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                          {screening.riskAssessment.explanation}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white rounded-xl gap-1.5 text-sm"
                        onClick={() => router.push(`/dashboard/clinician/case/${screening.id}`)}
                      >
                        Review Case <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      {screening.status === "submitted" && (
                        <Button
                          variant="outline"
                          className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 text-sm"
                          disabled={updatingId === screening.id}
                          onClick={() => markUnderReview(screening.id)}
                        >
                          {updatingId === screening.id ? "Updating…" : "Start Review"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}