"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, User, Calendar, ClipboardList, AlertCircle,
  Trash2, CheckCircle, Activity, Stethoscope, Eye,
  Sparkles, TrendingUp, ChevronDown, ChevronUp, History,
} from "lucide-react";
import { toast } from "sonner";
import { calculateAge, formatDate } from "@/lib/utils";

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent><Skeleton className="h-8 w-12" /></CardContent>
    </Card>
  );
}

function ChildCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-36" />
        <div className="pt-4 flex space-x-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

const ACTION_CONFIG = {
  referral: {
    label: "Refer to Specialist",
    desc: "Your child has been referred for immediate specialist evaluation. Please contact your healthcare provider to schedule an appointment as soon as possible.",
    icon: Stethoscope,
    cardBorder: "border-rose-200",
    bg: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
    textColor: "text-rose-800",
    badge: "bg-rose-100 text-rose-700",
    noteBorder: "border-rose-200/60",
  },
  monitoring: {
    label: "Continue Monitoring",
    desc: "A follow-up screening has been recommended in 3–6 months. Continue observing your child's development at home.",
    icon: Activity,
    cardBorder: "border-amber-200",
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    textColor: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
    noteBorder: "border-amber-200/60",
  },
  routine: {
    label: "Routine Follow-up",
    desc: "No immediate concerns identified. Continue with standard developmental checks at your next regular visit.",
    icon: CheckCircle,
    cardBorder: "border-emerald-200",
    bg: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-700",
    noteBorder: "border-emerald-200/60",
  },
};

const PROGRESS_CONFIG = {
  improving:  { color: "text-emerald-600", bg: "bg-emerald-100", label: "Improving"  },
  stagnant:   { color: "text-amber-600",   bg: "bg-amber-100",   label: "Stagnant"   },
  regressing: { color: "text-rose-600",    bg: "bg-rose-100",    label: "Regressing" },
};

export default function ParentDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [children, setChildren]         = useState([]);
  const [screenings, setScreenings]     = useState({});
  const [therapyPlans, setTherapyPlans] = useState({});   // childId → latest active plan
  const [latestProgress, setLatestProgress] = useState({}); // planId → latest progress
  const [isAddingChild, setIsAddingChild]   = useState(false);
  const [dataLoading, setDataLoading]       = useState(true);
  const [expandedHistory, setExpandedHistory] = useState({});  // childId → boolean
  const [newChild, setNewChild] = useState({ name: "", dateOfBirth: "", gender: "male" });

  useEffect(() => {
    if (!isLoaded || !user) return;
    loadData();
  }, [isLoaded]);

  async function loadData() {
    setDataLoading(true);
    try {
      const res = await fetch("/api/children");
      const childList = await res.json();
      setChildren(childList);

      const screeningsMap = {};
      const plansMap      = {};
      const progressMap   = {};

      await Promise.all(
        childList.map(async (child) => {
          const [sRes, pRes] = await Promise.all([
            fetch(`/api/screenings?childId=${child.id}`),
            fetch(`/api/therapy/plans?childId=${child.id}`),
          ]);
          screeningsMap[child.id] = await sRes.json();
          const plans = await pRes.json();
          const activePlan = Array.isArray(plans)
            ? plans.find(p => p.status === "active") ?? null
            : null;
          plansMap[child.id] = activePlan;

          // Fetch latest progress for the active plan
          if (activePlan) {
            const progRes = await fetch(`/api/therapy/progress?planId=${activePlan.id}&latest=true`);
            progressMap[activePlan.id] = await progRes.json();
          }
        }),
      );
      setScreenings(screeningsMap);
      setTherapyPlans(plansMap);
      setLatestProgress(progressMap);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setDataLoading(false);
    }
  }

  async function handleAddChild() {
    if (!newChild.name || !newChild.dateOfBirth) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChild),
      });
      if (!res.ok) throw new Error();
      const child = await res.json();
      setChildren([...children, child]);
      setScreenings({ ...screenings, [child.id]: [] });
      setTherapyPlans({ ...therapyPlans, [child.id]: null });
      setNewChild({ name: "", dateOfBirth: "", gender: "male" });
      setIsAddingChild(false);
      toast.success(`${child.name} added successfully`);
    } catch {
      toast.error("Failed to add child");
    }
  }

  async function handleDeleteChild(childId, childName) {
    if (!confirm(`Are you sure you want to delete ${childName}? This will also delete all their screenings.`)) return;
    try {
      const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setChildren(children.filter(c => c.id !== childId));
      const updatedS = { ...screenings };
      const updatedP = { ...therapyPlans };
      delete updatedS[childId];
      delete updatedP[childId];
      setScreenings(updatedS);
      setTherapyPlans(updatedP);
      toast.success(`${childName} removed`);
    } catch {
      toast.error("Failed to delete child");
    }
  }

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case "low":    return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high":   return "bg-red-100 text-red-800";
      default:       return "bg-gray-100 text-gray-800";
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold mb-2">
          Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </h2>
        <p className="text-gray-600">Manage your children and track their developmental screenings</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {dataLoading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Children</CardTitle>
                <User className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{children.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
                <ClipboardList className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(screenings).reduce((sum, s) => sum + s.length, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(screenings).filter(s => s[0]?.riskAssessment?.level === "high").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">children flagged high risk</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add Child */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Your Children</h3>
        <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Child</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
              <DialogDescription>Add a child to start developmental screening</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Child&apos;s Name</Label>
                <Input id="name" placeholder="Enter name" value={newChild.name}
                  onChange={e => setNewChild({ ...newChild, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={newChild.dateOfBirth}
                  onChange={e => setNewChild({ ...newChild, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={newChild.gender} onValueChange={v => setNewChild({ ...newChild, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingChild(false)}>Cancel</Button>
              <Button onClick={handleAddChild}>Add Child</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Children List */}
      {dataLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <ChildCardSkeleton /><ChildCardSkeleton />
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No children added yet</h3>
            <p className="text-gray-500 mb-4">Add a child to start developmental screening</p>
            <Button onClick={() => setIsAddingChild(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {children.map(child => {
            const childScreenings = screenings[child.id] || [];
            const latestScreening = childScreenings[0];
            const age             = calculateAge(child.dateOfBirth);
            const activePlan      = therapyPlans[child.id];
            const planProgress    = activePlan ? latestProgress[activePlan.id] : null;
            const progressCfg     = planProgress ? PROGRESS_CONFIG[planProgress.status] : null;

            const clinicianReview = latestScreening?.clinicianReview;
            const isActioned      = latestScreening?.status === "actioned" && clinicianReview?.action;
            const actionCfg       = isActioned ? ACTION_CONFIG[clinicianReview.action] : null;
            const ActionIcon      = actionCfg?.icon;

            return (
              <Card
                key={child.id}
                className={`border-2 transition-colors ${isActioned && actionCfg ? actionCfg.cardBorder : "border-transparent"}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{child.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {age.display} • {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {latestScreening?.riskAssessment && (
                        <Badge className={getRiskBadgeColor(latestScreening.riskAssessment.level)}>
                          {latestScreening.riskAssessment.level.toUpperCase()} Risk
                        </Badge>
                      )}
                      {isActioned && actionCfg && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionCfg.badge}`}>
                          ✓ Clinician Reviewed
                        </span>
                      )}
                      {activePlan && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          ✦ Therapy Active
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {childScreenings.length} screening{childScreenings.length !== 1 ? "s" : ""} completed
                  </div>

                  {/* ── Active Therapy Plan Banner ── */}
                  {activePlan && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-indigo-800 truncate">{activePlan.title}</p>
                            <p className="text-xs text-indigo-500">
                              {activePlan.frequency}
                              {activePlan.therapyTypes?.[0] && ` • ${activePlan.therapyTypes[0].split("(")[0].trim()}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-3 flex-shrink-0"
                          onClick={() => router.push(`/dashboard/parent/therapy/${activePlan.id}`)}
                        >
                          View Plan
                        </Button>
                      </div>

                      {/* Progress status inside plan banner */}
                      {progressCfg && planProgress && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${progressCfg.bg}`}>
                          <TrendingUp className={`h-3.5 w-3.5 flex-shrink-0 ${progressCfg.color}`} />
                          <span className={`text-xs font-semibold ${progressCfg.color}`}>
                            Progress: {progressCfg.label}
                          </span>
                          {planProgress.score != null && (
                            <span className="text-xs text-gray-400 ml-auto">
                              {planProgress.score.toFixed(1)}/10
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Clinician Decision Banner ── */}
                  {isActioned && actionCfg && ActionIcon && (
                    <div className={`rounded-xl border p-4 ${actionCfg.bg}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ActionIcon className={`h-4 w-4 flex-shrink-0 ${actionCfg.iconColor}`} />
                        <span className={`text-sm font-bold ${actionCfg.textColor}`}>
                          Clinical Decision: {actionCfg.label}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${actionCfg.textColor} opacity-80 mb-2`}>
                        {actionCfg.desc}
                      </p>
                      {clinicianReview.notes && (
                        <div className={`mt-2 pt-2 border-t ${actionCfg.noteBorder}`}>
                          <p className={`text-xs font-semibold mb-0.5 ${actionCfg.textColor} opacity-70`}>Clinician Notes:</p>
                          <p className={`text-xs leading-relaxed ${actionCfg.textColor} opacity-75 line-clamp-3`}>
                            {clinicianReview.notes}
                          </p>
                        </div>
                      )}
                      {clinicianReview.reviewedAt && (
                        <p className={`text-xs mt-2 ${actionCfg.textColor} opacity-50`}>
                          Reviewed on {formatDate(clinicianReview.reviewedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Awaiting review ── */}
                  {latestScreening && !isActioned && ["submitted", "under_review"].includes(latestScreening.status) && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700 font-medium">
                        {latestScreening.status === "under_review"
                          ? "A clinician is currently reviewing this screening."
                          : "Screening submitted — awaiting clinician review."}
                      </p>
                    </div>
                  )}

                  {/* ── Action buttons ── */}
                  <div className="pt-2 flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/parent/screening/${child.id}`)}
                    >
                      New Screening
                    </Button>
                    {childScreenings.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/parent/screening/result/${latestScreening.id}`)}
                      >
                        View Latest
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteChild(child.id, child.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ── Screening History Timeline ── */}
                  {childScreenings.length > 1 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setExpandedHistory(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-500 font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <History className="h-3.5 w-3.5" />
                          Screening History ({childScreenings.length})
                        </span>
                        {expandedHistory[child.id]
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        }
                      </button>

                      {expandedHistory[child.id] && (
                        <div className="mt-2 space-y-0 relative">
                          {/* Vertical line */}
                          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gray-200" />

                          {childScreenings.map((s, i) => {
                            const riskLevel = s.riskAssessment?.level;
                            const dotColor =
                              riskLevel === "high"   ? "bg-rose-500" :
                              riskLevel === "medium" ? "bg-amber-400" :
                              riskLevel === "low"    ? "bg-emerald-500" :
                                                       "bg-gray-300";
                            const riskBadge =
                              riskLevel === "high"   ? "bg-rose-100 text-rose-700" :
                              riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                              riskLevel === "low"    ? "bg-emerald-100 text-emerald-700" :
                                                       "bg-gray-100 text-gray-500";
                            const statusLabel =
                              s.status === "actioned"     ? "Actioned" :
                              s.status === "reviewed"     ? "Reviewed" :
                              s.status === "under_review" ? "In Review" :
                                                            "Submitted";
                            const isLatest = i === 0;

                            return (
                              <div
                                key={s.id}
                                className="relative flex items-start gap-3 pl-2 pr-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/dashboard/parent/screening/result/${s.id}`)}
                              >
                                {/* Timeline dot */}
                                <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm z-10 ${dotColor}`} />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-700">
                                      {formatDate(s.submittedAt || s.createdAt)}
                                    </span>
                                    {isLatest && (
                                      <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                                        Latest
                                      </span>
                                    )}
                                    {riskLevel && (
                                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${riskBadge}`}>
                                        {riskLevel.toUpperCase()}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">{statusLabel}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Score: {s.questionnaireScore ?? "—"}/15
                                    {s.riskAssessment?.combinedScore != null && ` • AI: ${s.riskAssessment.combinedScore}%`}
                                    {s.videos?.length > 0 && ` • ${s.videos.length} video${s.videos.length > 1 ? "s" : ""}`}
                                  </p>
                                </div>

                                <ChevronUp className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 rotate-90 flex-shrink-0 mt-1" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm">
          <p>
            This screening tool is designed to identify children who may benefit
            from further evaluation. It is not a diagnostic tool. If you have
            concerns about your child&apos;s development, please consult with a
            qualified healthcare professional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}