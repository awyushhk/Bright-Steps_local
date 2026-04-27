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

    await query(`
      CREATE TABLE IF NOT EXISTS child_summaries (
        child_id TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
        child_name TEXT NOT NULL,
        risk_assessment TEXT NOT NULL,
        actioned TEXT NOT NULL DEFAULT 'no',
        latest_screening_id TEXT REFERENCES screenings(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS high_risk_children (
        child_id TEXT PRIMARY KEY,
        child_name TEXT NOT NULL,
        actioned TEXT NOT NULL DEFAULT 'no',
        clinical_review_notes TEXT,
        action_taken TEXT,
        result TEXT,
        year INTEGER NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS medium_risk_children (
        child_id TEXT PRIMARY KEY,
        child_name TEXT NOT NULL,
        actioned TEXT NOT NULL DEFAULT 'no',
        clinical_review_notes TEXT,
        action_taken TEXT,
        result TEXT,
        year INTEGER NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS low_risk_children (
        child_id TEXT PRIMARY KEY,
        child_name TEXT NOT NULL,
        actioned TEXT NOT NULL DEFAULT 'no',
        clinical_review_notes TEXT,
        action_taken TEXT,
        result TEXT,
        year INTEGER NOT NULL
      )
    `);

    await query(`
      CREATE OR REPLACE FUNCTION shift_to_medium_risk()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.result = 'Shifted to MEDIUM Risk' THEN
          INSERT INTO medium_risk_children (
            child_id, child_name, actioned, clinical_review_notes, action_taken, result, year
          ) VALUES (
            NEW.child_id, NEW.child_name, NEW.actioned, NEW.clinical_review_notes, NEW.action_taken, 'Under Progress', NEW.year
          )
          ON CONFLICT (child_id) DO UPDATE SET
            child_name = EXCLUDED.child_name,
            actioned = EXCLUDED.actioned,
            clinical_review_notes = EXCLUDED.clinical_review_notes,
            action_taken = EXCLUDED.action_taken,
            result = 'Under Progress',
            year = EXCLUDED.year;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_shift_to_medium_risk ON high_risk_children;
    `);

    await query(`
      CREATE TRIGGER trigger_shift_to_medium_risk
      AFTER INSERT OR UPDATE ON high_risk_children
      FOR EACH ROW
      EXECUTE FUNCTION shift_to_medium_risk();
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS state_cases (
        child_id TEXT PRIMARY KEY,
        child_name TEXT NOT NULL,
        state TEXT NOT NULL,
        actioned TEXT NOT NULL DEFAULT 'no',
        risk_assessment TEXT NOT NULL,
        month TEXT NOT NULL,
        results TEXT
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS case_progress (
        progress_id TEXT PRIMARY KEY,
        case_id TEXT REFERENCES state_cases(child_id),
        month TEXT NOT NULL,
        risk_assessment TEXT NOT NULL,
        result TEXT,
        improvement_score INTEGER NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS state_performance (
        state TEXT PRIMARY KEY,
        early_action_score INTEGER NOT NULL,
        improvement_score INTEGER NOT NULL,
        service_quality_score INTEGER NOT NULL,
        total_score INTEGER NOT NULL
      )
    `);

    return Response.json({ success: true, message: 'All tables created' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}