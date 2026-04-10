import { getAuthUser } from "@/lib/auth";
import { getTherapyPlan, updateTherapyPlan } from "@/lib/therapy-queries";

export async function GET(request, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId } = await params;
    const plan = await getTherapyPlan(planId);
    if (!plan) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(plan);
  } catch (err) {
    console.error("GET /api/therapy/plans/[planId] error:", err);
    return Response.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId } = await params;
    const body = await request.json();
    const plan = await updateTherapyPlan(planId, body);
    return Response.json(plan);
  } catch (err) {
    console.error("PATCH /api/therapy/plans/[planId] error:", err);
    return Response.json({ error: "Failed to update plan" }, { status: 500 });
  }
}