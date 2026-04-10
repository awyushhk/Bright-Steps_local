import { getAuthUser } from "@/lib/auth";
import {
  createTherapySession,
  getTherapySessionsByPlan,
} from "@/lib/therapy-queries";

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId");

  if (!planId) return Response.json({ error: "planId required" }, { status: 400 });

  try {
    const sessions = await getTherapySessionsByPlan(planId);
    return Response.json(sessions, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("GET /api/therapy/sessions error:", err);
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const session = await createTherapySession({
      planId: body.planId,
      childId: body.childId,
      loggedBy: user.id,
      sessionDate: body.sessionDate,
      durationMinutes: body.durationMinutes,
      activities: body.activities ?? [],
      behaviorRatings: body.behaviorRatings ?? {},
      notes: body.notes,
      mood: body.mood,
    });
    return Response.json(session, { status: 201 });
  } catch (err) {
    console.error("POST /api/therapy/sessions error:", err);
    return Response.json({ error: "Failed to log session" }, { status: 500 });
  }
}