import sql from './db';

export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS screenings (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      submitted_at TEXT,
      questionnaire_responses JSONB,
      questionnaire_score INTEGER DEFAULT 0,
      videos JSONB DEFAULT '[]',
      risk_assessment JSONB,
      clinician_review JSONB
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS child_summaries (
      child_id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      risk_assessment TEXT NOT NULL,
      actioned TEXT NOT NULL DEFAULT 'no',
      latest_screening_id TEXT,
      updated_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS high_risk_children (
      child_id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      actioned TEXT NOT NULL DEFAULT 'no',
      clinical_review_notes TEXT,
      action_taken TEXT,
      result TEXT,
      year INTEGER NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS medium_risk_children (
      child_id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      actioned TEXT NOT NULL DEFAULT 'no',
      clinical_review_notes TEXT,
      action_taken TEXT,
      result TEXT,
      year INTEGER NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS low_risk_children (
      child_id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      actioned TEXT NOT NULL DEFAULT 'no',
      clinical_review_notes TEXT,
      action_taken TEXT,
      result TEXT,
      year INTEGER NOT NULL
    )
  `;

  await sql`
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
  `;

  await sql`
    DROP TRIGGER IF EXISTS trigger_shift_to_medium_risk ON high_risk_children;
  `;

  await sql`
    CREATE TRIGGER trigger_shift_to_medium_risk
    AFTER INSERT OR UPDATE ON high_risk_children
    FOR EACH ROW
    EXECUTE FUNCTION shift_to_medium_risk();
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS state_cases (
      child_id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      state TEXT NOT NULL,
      actioned TEXT NOT NULL DEFAULT 'no',
      risk_assessment TEXT NOT NULL,
      month TEXT NOT NULL,
      results TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS case_progress (
      progress_id TEXT PRIMARY KEY,
      case_id TEXT REFERENCES state_cases(child_id),
      month TEXT NOT NULL,
      risk_assessment TEXT NOT NULL,
      result TEXT,
      improvement_score INTEGER NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS state_performance (
      state TEXT PRIMARY KEY,
      early_action_score INTEGER NOT NULL,
      improvement_score INTEGER NOT NULL,
      service_quality_score INTEGER NOT NULL,
      total_score INTEGER NOT NULL
    )
  `;
}