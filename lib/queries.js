import { query } from './db';
import { generateId } from './utils';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CHILDREN
// ============================================

export async function getChildrenByParent(parentId) {
  const rows = await query(
    'SELECT * FROM children WHERE parent_id = $1 ORDER BY created_at DESC',
    [parentId]
  );
  return rows.map(toCamelChild);
}

export async function getChildById(childId) {
  const rows = await query(
    'SELECT * FROM children WHERE id = $1',
    [childId]
  );
  return rows[0] ? toCamelChild(rows[0]) : null;
}

export async function addChild({ parentId, name, dateOfBirth, gender }) {
  const rows = await query(
    'INSERT INTO children (parent_id, name, date_of_birth, gender) VALUES ($1, $2, $3, $4) RETURNING *',
    [parentId, name, dateOfBirth, gender]
  );
  return toCamelChild(rows[0]);
}

export async function updateChild(childId, updates) {
  if (updates.name !== undefined) {
    await query(
      'UPDATE children SET name = $1 WHERE id = $2',
      [updates.name, childId]
    );
    await query(
      'UPDATE child_summaries SET child_name = $1 WHERE child_id = $2',
      [updates.name, childId]
    );
  }
}

// ============================================
// SCREENINGS
// ============================================

export async function getScreeningsByChild(childId) {
  const rows = await query(
    'SELECT * FROM screenings WHERE child_id = $1 ORDER BY created_at DESC',
    [childId]
  );
  return rows.map(toCamelScreening);
}

export async function getScreeningsByParent(parentId) {
  const rows = await query(
    'SELECT * FROM screenings WHERE parent_id = $1 ORDER BY created_at DESC',
    [parentId]
  );
  return rows.map(toCamelScreening);
}

export async function getScreeningById(screeningId) {
  const rows = await query(
    'SELECT * FROM screenings WHERE id = $1',
    [screeningId]
  );
  return rows[0] ? toCamelScreening(rows[0]) : null;
}

export async function getAllSubmittedScreenings() {
  const rows = await query(
    `SELECT s.*, c.name AS child_name, c.date_of_birth AS child_dob, c.gender AS child_gender
    FROM screenings s
    LEFT JOIN children c ON s.child_id = c.id
    WHERE s.status != $1
    ORDER BY s.created_at DESC`,
    ['draft']
  );
  
  return rows.map(toCamelScreening);
}

export async function getScreeningWithChild(screeningId) {
  const rows = await query(
    `SELECT s.*, c.name AS child_name, c.date_of_birth AS child_dob, c.gender AS child_gender
    FROM screenings s
    LEFT JOIN children c ON s.child_id = c.id
    WHERE s.id = $1`,
    [screeningId]
  );
  return rows[0] ? toCamelScreening(rows[0]) : null;
}

export async function addScreening(screening) {
  const {
    childId,
    parentId,
    status,
    createdAt,
    submittedAt,
    questionnaireResponses,
    questionnaireScore,
    videos,
    riskAssessment,
  } = screening;

  const id = uuidv4();

  const rows = await query(
    `INSERT INTO screenings (
      id, child_id, parent_id, status, created_at, submitted_at,
      questionnaire_responses, questionnaire_score, videos, risk_assessment
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    ) RETURNING *`,
    [
      id, childId, parentId, status, createdAt, submittedAt ?? null,
      JSON.stringify(questionnaireResponses), questionnaireScore,
      JSON.stringify(videos), JSON.stringify(riskAssessment)
    ]
  );
  const result = toCamelScreening(rows[0]);
  if (result.status !== 'draft') {
    await syncChildSummary(childId);
  }
  return result;
}

export async function updateScreening(screeningId, updates) {
  if (updates.clinicianReview !== undefined) {
    await query(
      `UPDATE screenings
      SET clinician_review = $1,
          status = $2
      WHERE id = $3`,
      [JSON.stringify(updates.clinicianReview), updates.status ?? 'reviewed', screeningId]
    );
  }
  if (updates.status !== undefined && updates.clinicianReview === undefined) {
    await query(
      'UPDATE screenings SET status = $1 WHERE id = $2',
      [updates.status, screeningId]
    );
  }

  // Sync summary
  const screening = await getScreeningById(screeningId);
  if (screening && screening.status !== 'draft') {
    await syncChildSummary(screening.childId);
  }
}

// ============================================
// CHILD SUMMARIES
// ============================================

export async function getAllChildSummaries() {
  const rows = await query('SELECT * FROM child_summaries ORDER BY updated_at DESC');
  return rows.map(toCamelSummary);
}

export async function syncChildSummary(childId) {
  // Get latest screening and child info
  const rows = await query(
    `SELECT s.*, c.name AS child_name
    FROM screenings s
    LEFT JOIN children c ON s.child_id = c.id
    WHERE s.child_id = $1 AND s.status != 'draft'
    ORDER BY s.created_at DESC
    LIMIT 1`,
    [childId]
  );

  if (rows.length === 0) return;

  const screening = rows[0];
  const riskAssessment = screening.risk_assessment ?? {};
  const riskLevel = (riskAssessment.level ?? 'LOW').toUpperCase();
  const actioned = (screening.status === 'reviewed' || screening.status === 'actioned') ? 'yes' : 'no';

  await query(
    `INSERT INTO child_summaries (
      child_id, child_name, risk_assessment, actioned, latest_screening_id, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    ) ON CONFLICT (child_id) DO UPDATE SET
      child_name = EXCLUDED.child_name,
      risk_assessment = EXCLUDED.risk_assessment,
      actioned = EXCLUDED.actioned,
      latest_screening_id = EXCLUDED.latest_screening_id,
      updated_at = EXCLUDED.updated_at`,
    [
      childId,
      screening.child_name,
      riskLevel,
      actioned,
      screening.id,
      new Date().toISOString()
    ]
  );
}

export async function updateChildSummaryAction(childId, actioned) {
  await query(
    'UPDATE child_summaries SET actioned = $1 WHERE child_id = $2',
    [actioned, childId]
  );
}

// ============================================
// STATE CASES & PROGRESSION
// ============================================

export async function getStatePerformance() {
  const rows = await query('SELECT * FROM state_performance ORDER BY total_score DESC');
  return rows.map(row => ({
    state: row.state,
    earlyActionScore: row.early_action_score,
    improvementScore: row.improvement_score,
    serviceQualityScore: row.service_quality_score,
    totalScore: row.total_score,
  }));
}

export async function getCaseProgression() {
  const childrenRows = await query('SELECT * FROM state_cases ORDER BY child_id ASC');
  const progressRows = await query('SELECT * FROM case_progress ORDER BY month ASC'); // Month ordering might need custom logic, but for now it's fine

  const progressByCase = {};
  progressRows.forEach(row => {
    if (!progressByCase[row.case_id]) {
      progressByCase[row.case_id] = [];
    }
    progressByCase[row.case_id].push({
      month: row.month,
      riskAssessment: row.risk_assessment,
      result: row.result,
      improvementScore: row.improvement_score,
    });
  });

  return childrenRows.map(row => ({
    childId: row.child_id,
    childName: row.child_name,
    state: row.state,
    actioned: row.actioned,
    latestRisk: row.risk_assessment,
    latestResult: row.results,
    progression: progressByCase[row.child_id] || [],
  }));
}

// ============================================
// Helpers
// ============================================
function toCamelChild(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    createdAt: row.created_at,
  };
}

function toCamelScreening(row) {
  return {
    id: row.id,
    childId: row.child_id,
    parentId: row.parent_id,
    status: row.status,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    questionnaireResponses: row.questionnaire_responses ?? [],
    questionnaireScore: row.questionnaire_score ?? 0,
    videos: row.videos ?? [],
    riskAssessment: row.risk_assessment ?? null,
    clinicianReview: row.clinician_review ?? null,
    // Joined child fields (present when queried with JOIN)
    childName: row.child_name ?? null,
    childDob: row.child_dob ?? null,
    childGender: row.child_gender ?? null,
  };
}

function toCamelSummary(row) {
  return {
    childId: row.child_id,
    childName: row.child_name,
    riskAssessment: row.risk_assessment,
    actioned: row.actioned,
    latestScreeningId: row.latest_screening_id,
    updatedAt: row.updated_at,
  };
}

