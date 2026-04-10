import { query } from './db';

// ── Therapy Plans ──────────────────────────────

export async function createTherapyPlan({
  childId, clinicianId, title, goals, therapyTypes, frequency, notes
}) {
  const rows = await query(
    `INSERT INTO therapy_plans (child_id, clinician_id, title, goals, therapy_types, frequency, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      childId, clinicianId, title,
      JSON.stringify(goals ?? []),
      JSON.stringify(therapyTypes ?? []),
      frequency ?? null, notes ?? null
    ]
  );
  return toTherapyPlan(rows[0]);
}

export async function getTherapyPlan(planId) {
  const rows = await query(
    `SELECT tp.*, c.name as child_name, c.date_of_birth as child_dob
    FROM therapy_plans tp
    LEFT JOIN children c ON c.id = tp.child_id
    WHERE tp.id = $1`,
    [planId]
  );
  return rows[0] ? toTherapyPlan(rows[0]) : null;
}

export async function getTherapyPlansByChild(childId) {
  const rows = await query(
    `SELECT tp.*, c.name as child_name, c.date_of_birth as child_dob
    FROM therapy_plans tp
    LEFT JOIN children c ON c.id = tp.child_id
    WHERE tp.child_id = $1
    ORDER BY tp.created_at DESC`,
    [childId]
  );
  return rows.map(toTherapyPlan);
}

export async function getAllTherapyPlans() {
  const rows = await query(
    `SELECT tp.*, c.name as child_name, c.date_of_birth as child_dob
    FROM therapy_plans tp
    LEFT JOIN children c ON c.id = tp.child_id
    ORDER BY tp.created_at DESC`,
    []
  );
  return rows.map(toTherapyPlan);
}

export async function updateTherapyPlan(planId, updates) {
  const values = [planId];
  const setClauses = [];
  let paramCount = 2;

  if (updates.title !== undefined) {
    setClauses.push(`title = $${paramCount++}`);
    values.splice(-1, 0, updates.title);
  }
  if (updates.goals !== undefined) {
    setClauses.push(`goals = $${paramCount++}`);
    values.splice(-1, 0, JSON.stringify(updates.goals));
  }
  if (updates.therapyTypes !== undefined) {
    setClauses.push(`therapy_types = $${paramCount++}`);
    values.splice(-1, 0, JSON.stringify(updates.therapyTypes));
  }
  if (updates.frequency !== undefined) {
    setClauses.push(`frequency = $${paramCount++}`);
    values.splice(-1, 0, updates.frequency ?? null);
  }
  if (updates.notes !== undefined) {
    setClauses.push(`notes = $${paramCount++}`);
    values.splice(-1, 0, updates.notes ?? null);
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${paramCount++}`);
    values.splice(-1, 0, updates.status ?? null);
  }

  if (setClauses.length > 0) {
    await query(
      `UPDATE therapy_plans SET ${setClauses.join(', ')} WHERE id = $1`,
      values
    );
  }

  return getTherapyPlan(planId);
}

// ── Therapy Sessions ───────────────────────────

export async function createTherapySession({
  planId, childId, loggedBy, sessionDate, durationMinutes,
  activities, behaviorRatings, notes, mood
}) {
  const rows = await query(
    `INSERT INTO therapy_sessions
      (plan_id, child_id, logged_by, session_date, duration_minutes, activities, behavior_ratings, notes, mood)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      planId, childId, loggedBy, sessionDate,
      durationMinutes ?? null,
      JSON.stringify(activities ?? []),
      JSON.stringify(behaviorRatings ?? {}),
      notes ?? null, mood ?? null
    ]
  );
  await computeAndSaveProgress(planId, childId);
  return toTherapySession(rows[0]);
}

export async function getTherapySession(sessionId) {
  const rows = await query(
    'SELECT * FROM therapy_sessions WHERE id = $1',
    [sessionId]
  );
  return rows[0] ? toTherapySession(rows[0]) : null;
}

export async function getTherapySessionsByPlan(planId) {
  const rows = await query(
    `SELECT * FROM therapy_sessions
    WHERE plan_id = $1
    ORDER BY session_date DESC, created_at DESC`,
    [planId]
  );
  return rows.map(toTherapySession);
}

// ── Progress Snapshots ─────────────────────────

export async function computeAndSaveProgress(planId, childId) {
  const sessions = await query(
    `SELECT behavior_ratings FROM therapy_sessions
    WHERE plan_id = $1
    ORDER BY session_date DESC, created_at DESC
    LIMIT 5`,
    [planId]
  );

  if (sessions.length === 0) return null;

  const scores = sessions
    .map(s => s.behavior_ratings?.overall_score)
    .filter(v => v != null);

  if (scores.length < 2) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recent = scores[0];
  const older = scores[scores.length - 1];
  const diff = recent - older;

  let status = "stagnant";
  if (diff >= 1) status = "improving";
  else if (diff <= -1) status = "regressing";

  await query(
    `INSERT INTO progress_snapshots (plan_id, child_id, status, score)
    VALUES ($1, $2, $3, $4)`,
    [planId, childId, status, Math.round(avg * 10) / 10]
  );

  if (status === "stagnant" || status === "regressing") {
    await maybeCreateAlert(planId, childId, status);
  }

  return { status, score: avg };
}

export async function getProgressByPlan(planId) {
  const rows = await query(
    `SELECT * FROM progress_snapshots
    WHERE plan_id = $1
    ORDER BY created_at ASC`,
    [planId]
  );
  return rows.map(r => ({
    id: r.id,
    planId: r.plan_id,
    childId: r.child_id,
    status: r.status,
    score: parseFloat(r.score),
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function getLatestProgress(planId) {
  const rows = await query(
    `SELECT * FROM progress_snapshots
    WHERE plan_id = $1
    ORDER BY created_at DESC
    LIMIT 1`,
    [planId]
  );
  if (!rows[0]) return null;
  return {
    status: rows[0].status,
    score: parseFloat(rows[0].score),
    createdAt: rows[0].created_at,
  };
}

// ── Alerts ─────────────────────────────────────

async function maybeCreateAlert(planId, childId, progressStatus) {
  const existing = await query(
    `SELECT id FROM therapy_alerts
    WHERE plan_id = $1 AND type = $2 AND is_read = FALSE
    LIMIT 1`,
    [planId, progressStatus]
  );
  if (existing.length > 0) return;

  const message =
    progressStatus === "regressing"
      ? "Child's progress is regressing. Therapy plan review is recommended."
      : "Child's progress has been stagnant. Consider adjusting therapy activities.";

  await query(
    `INSERT INTO therapy_alerts (plan_id, child_id, type, message)
    VALUES ($1, $2, $3, $4)`,
    [planId, childId, progressStatus, message]
  );
}

export async function getAlertsByPlan(planId) {
  const rows = await query(
    `SELECT * FROM therapy_alerts WHERE plan_id = $1 ORDER BY created_at DESC`,
    [planId]
  );
  return rows.map(toAlert);
}

export async function getAllUnreadAlerts() {
  const rows = await query(
    `SELECT ta.*, tp.title as plan_title, c.name as child_name
    FROM therapy_alerts ta
    LEFT JOIN therapy_plans tp ON tp.id = ta.plan_id
    LEFT JOIN children c ON c.id = ta.child_id
    WHERE ta.is_read = FALSE
    ORDER BY ta.created_at DESC`,
    []
  );
  return rows.map(r => ({
    ...toAlert(r),
    planTitle: r.plan_title,
    childName: r.child_name,
  }));
}

export async function markAlertRead(alertId) {
  await query(
    'UPDATE therapy_alerts SET is_read = TRUE WHERE id = $1',
    [alertId]
  );
}

// ── Camelcase helpers ──────────────────────────

function toTherapyPlan(r) {
  return {
    id: r.id,
    childId: r.child_id,
    clinicianId: r.clinician_id,
    childName: r.child_name ?? null,
    childDob: r.child_dob ?? null,
    title: r.title,
    goals: r.goals ?? [],
    therapyTypes: r.therapy_types ?? [],
    frequency: r.frequency,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toTherapySession(r) {
  return {
    id: r.id,
    planId: r.plan_id,
    childId: r.child_id,
    loggedBy: r.logged_by,
    sessionDate: r.session_date,
    durationMinutes: r.duration_minutes,
    activities: r.activities ?? [],
    behaviorRatings: r.behavior_ratings ?? {},
    notes: r.notes,
    mood: r.mood,
    createdAt: r.created_at,
  };
}

function toAlert(r) {
  return {
    id: r.id,
    planId: r.plan_id,
    childId: r.child_id,
    type: r.type,
    message: r.message,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}