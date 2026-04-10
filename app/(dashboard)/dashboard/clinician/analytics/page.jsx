"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  AlertCircle,
  Brain,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

function Skeleton({ className }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
}

function ChartSkeleton({ height = "h-48" }) {
  return (
    <div className={`${height} rounded-2xl bg-gray-100 flex items-center justify-center`}>
      <div className="space-y-2 w-full px-6">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

const RISK_COLORS = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };
const STATUS_COLORS = {
  submitted: "#60a5fa",
  under_review: "#a78bfa",
  reviewed: "#94a3b8",
  actioned: "#34d399",
};

function computeAnalytics(screenings) {
  // 1. Risk distribution
  const riskCounts = { low: 0, medium: 0, high: 0 };
  screenings.forEach((s) => {
    const lvl = s.riskAssessment?.level;
    if (lvl) riskCounts[lvl]++;
  });
  const riskData = [
    { name: "Low",    value: riskCounts.low,    color: RISK_COLORS.low    },
    { name: "Medium", value: riskCounts.medium, color: RISK_COLORS.medium },
    { name: "High",   value: riskCounts.high,   color: RISK_COLORS.high   },
  ].filter((d) => d.value > 0);

  // 2. Screenings over time (group by week)
  const byWeek = {};
  screenings.forEach((s) => {
    const d = new Date(s.submittedAt || s.createdAt);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    if (!byWeek[key]) byWeek[key] = { week: key, total: 0, high: 0 };
    byWeek[key].total++;
    if (s.riskAssessment?.level === "high") byWeek[key].high++;
  });
  const timeData = Object.values(byWeek).slice(-8);

  // 3. Behavioral indicators avg
  const indicatorKeys = [
    "eye_contact", "response_to_name", "social_engagement",
    "repetitive_movements", "pointing_gesturing",
  ];
  const indicatorLabels = {
    eye_contact: "Eye Contact",
    response_to_name: "Name Response",
    social_engagement: "Social",
    repetitive_movements: "Repetitive",
    pointing_gesturing: "Gesturing",
  };
  const sums = {}; const counts = {};
  indicatorKeys.forEach((k) => { sums[k] = 0; counts[k] = 0; });
  screenings.forEach((s) => {
    const vi = s.riskAssessment?.videoIndicators;
    if (!vi) return;
    indicatorKeys.forEach((k) => {
      if (vi[k] != null) { sums[k] += vi[k]; counts[k]++; }
    });
  });
  const indicatorData = indicatorKeys
    .map((k) => ({
      name: indicatorLabels[k],
      avg: counts[k] > 0 ? Math.round((sums[k] / counts[k]) * 10) / 10 : null,
      count: counts[k],
    }))
    .filter((d) => d.avg !== null);

  // 4. Status funnel
  const statusCounts = { submitted: 0, under_review: 0, reviewed: 0, actioned: 0 };
  screenings.forEach((s) => {
    if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
  });
  const funnelData = [
    { name: "Submitted",   value: screenings.length,                                                          fill: STATUS_COLORS.submitted    },
    { name: "Under Review",value: statusCounts.under_review + statusCounts.reviewed + statusCounts.actioned,  fill: STATUS_COLORS.under_review  },
    { name: "Reviewed",    value: statusCounts.reviewed + statusCounts.actioned,                              fill: STATUS_COLORS.reviewed      },
    { name: "Actioned",    value: statusCounts.actioned,                                                      fill: STATUS_COLORS.actioned      },
  ];

  // 5. Summary stats
  const avgScore = screenings.length
    ? Math.round(
        screenings.reduce(
          (s, sc) => s + (sc.riskAssessment?.combinedScore ?? sc.riskAssessment?.score ?? 0), 0
        ) / screenings.length
      )
    : 0;
  const withVideos = screenings.filter((s) => s.videos?.length > 0).length;
  const withAI = screenings.filter((s) => s.riskAssessment?.videoIndicators).length;

  // 6. Unique children
  const uniqueChildren = new Set(screenings.map((s) => s.childId)).size;

  return {
    riskData, timeData, indicatorData, funnelData,
    riskCounts, avgScore, withVideos, withAI, statusCounts, uniqueChildren,
  };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/screenings?all=true")
      .then((r) => r.json())
      .then((data) => { setScreenings(data); setLoading(false); })
      .catch(() => { toast.error("Failed to load data"); setLoading(false); });
  }, [isLoaded]);

  const analytics = loading ? null : computeAnalytics(screenings);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-800 to-violet-900 p-7 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-indigo-300" />
              <span className="text-indigo-300 text-xs font-semibold tracking-widest uppercase">
                Analytics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Screening Analytics
            </h1>
            <p className="text-indigo-200 text-sm max-w-sm leading-relaxed">
              Population-level insights across all submitted screenings.
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center flex-shrink-0">
            <Activity className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Screenings",  value: screenings.length,                    icon: TrendingUp,  color: "text-white"        },
            { label: "Unique Children",   value: analytics?.uniqueChildren ?? "—",     icon: Users,       color: "text-indigo-300"   },
            { label: "High Risk Cases",   value: analytics?.riskCounts.high ?? "—",    icon: AlertCircle, color: "text-rose-300"     },
            { label: "AI Analyzed",       value: analytics?.withAI ?? "—",             icon: Brain,       color: "text-violet-300"   },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <div className="text-xl font-bold leading-none">
                  {loading ? "—" : value}
                </div>
                <div className="text-indigo-200 text-xs mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Risk Distribution */}
        <Card className="rounded-3xl border-0 shadow-md shadow-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Distribution</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of all screenings by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : analytics.riskData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.riskData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3} dataKey="value"
                    >
                      {analytics.riskData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {analytics.riskData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm text-gray-600">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{d.value}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({Math.round((d.value / screenings.length) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenings over time */}
        <Card className="rounded-3xl border-0 shadow-md shadow-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Screenings Over Time</CardTitle>
            <CardDescription className="text-xs">
              Weekly submission volume and high-risk cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : analytics.timeData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.timeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="total" name="Total"     stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="high"  name="High Risk" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Behavioral Indicators */}
        <Card className="rounded-3xl border-0 shadow-md shadow-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Behavioral Indicators</CardTitle>
            <CardDescription className="text-xs">
              Mean AI scores across video-analyzed cases (10 = typical, 0 = concern)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : analytics.indicatorData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                No video-analyzed cases yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.indicatorData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]}>
                    {analytics.indicatorData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avg >= 7 ? "#10b981" : entry.avg >= 4 ? "#f59e0b" : "#f43f5e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Case Status Funnel */}
        <Card className="rounded-3xl border-0 shadow-md shadow-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Case Status Funnel</CardTitle>
            <CardDescription className="text-xs">
              How screenings progress through the review workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height="h-56" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel dataKey="value" data={analytics.funnelData} isAnimationActive>
                      <LabelList position="center" fill="#fff" fontSize={12} fontWeight={600} dataKey="name" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {analytics.funnelData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                        <span className="text-xs text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Insight cards ── */}
      {!loading && screenings.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 pb-8">
          {[
            {
              title: "High Risk Rate",
              value: `${Math.round((analytics.riskCounts.high / screenings.length) * 100)}%`,
              desc: "of all screenings flagged high risk",
              color: "border-rose-200 bg-rose-50",
              textColor: "text-rose-600",
            },
            {
              title: "Avg Screenings / Child",
              value: analytics.uniqueChildren > 0
                ? (screenings.length / analytics.uniqueChildren).toFixed(1)
                : "0",
              desc: "screenings submitted per child on average",
              color: "border-violet-200 bg-violet-50",
              textColor: "text-violet-600",
            },
            {
              title: "Action Rate",
              value: `${Math.round((analytics.statusCounts.actioned / screenings.length) * 100)}%`,
              desc: "of cases fully actioned by clinicians",
              color: "border-emerald-200 bg-emerald-50",
              textColor: "text-emerald-600",
            },
          ].map(({ title, value, desc, color, textColor }) => (
            <div key={title} className={`rounded-2xl border p-5 ${color}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
              <p className={`text-3xl font-bold ${textColor} mb-1`}>{value}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}