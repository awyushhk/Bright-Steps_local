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
  return toCamelScreening(rows[0]);
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

