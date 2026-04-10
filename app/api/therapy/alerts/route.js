import { getAuthUser } from "@/lib/auth";
import {
  getAllUnreadAlerts,
  getAlertsByPlan,
  markAlertRead,
} from "@/lib/therapy-queries";

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId");
  const unread = searchParams.get("unread");

  try {
    if (unread === "true") {
      const alerts = await getAllUnreadAlerts();
      return Response.json(alerts);
    }
    if (planId) {
      const alerts = await getAlertsByPlan(planId);
      return Response.json(alerts);
    }
    return Response.json([]);
  } catch (err) {
    console.error("GET /api/therapy/alerts error:", err);
    return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { alertId } = await request.json();
    await markAlertRead(alertId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/therapy/alerts error:", err);
    return Response.json({ error: "Failed to mark alert read" }, { status: 500 });
  }
}