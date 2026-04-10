import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'parent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        gender TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS screenings (
        id TEXT PRIMARY KEY,
        child_id TEXT REFERENCES children(id) ON DELETE CASCADE,
        parent_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'submitted',
        questionnaire_responses JSONB,
        questionnaire_score INTEGER,
        videos JSONB DEFAULT '[]',
        risk_assessment JSONB,
        clinician_review JSONB,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS therapy_plans (
        id TEXT PRIMARY KEY,
        child_id TEXT REFERENCES children(id) ON DELETE CASCADE,
        clinician_id TEXT REFERENCES users(id),
        title TEXT NOT NULL,
        goals JSONB DEFAULT '[]',
        therapy_types JSONB DEFAULT '[]',
        frequency TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id TEXT PRIMARY KEY,
        plan_id TEXT REFERENCES therapy_plans(id) ON DELETE CASCADE,
        child_id TEXT REFERENCES children(id) ON DELETE CASCADE,
        logged_by TEXT REFERENCES users(id),
        session_date DATE NOT NULL,
        duration_minutes INTEGER,
        activities JSONB DEFAULT '[]',
        behavior_ratings JSONB DEFAULT '{}',
        notes TEXT,
        mood TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS progress_snapshots (
        id TEXT PRIMARY KEY,
        plan_id TEXT REFERENCES therapy_plans(id) ON DELETE CASCADE,
        child_id TEXT REFERENCES children(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('improving','stagnant','regressing')),
        score NUMERIC(4,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS therapy_alerts (
        id TEXT PRIMARY KEY,
        plan_id TEXT REFERENCES therapy_plans(id) ON DELETE CASCADE,
        child_id TEXT REFERENCES children(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    return Response.json({ success: true, message: 'All tables created' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}