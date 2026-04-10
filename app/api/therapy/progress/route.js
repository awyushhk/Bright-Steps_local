import { getAuthUser } from "@/lib/auth";
import { getProgressByPlan, getLatestProgress } from "@/lib/therapy-queries";

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId");
  const latest = searchParams.get("latest");

  if (!planId) return Response.json({ error: "planId required" }, { status: 400 });

  try {
    if (latest === "true") {
      const progress = await getLatestProgress(planId);
      return Response.json(progress);
    }
    const progress = await getProgressByPlan(planId);
    return Response.json(progress);
  } catch (err) {
    console.error("GET /api/therapy/progress error:", err);
    return Response.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}