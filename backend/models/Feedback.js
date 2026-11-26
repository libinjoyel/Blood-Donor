const { query, isValidUuid } = require('../config/db');

function formatFeedback(row) {
  if (!row) return null;
  const userId = row.u_name !== undefined
    ? { _id: row.user_id, name: row.u_name, email: row.u_email, bloodGroup: row.u_blood_group }
    : row.user_id;
  const bloodBankId = row.bb_name !== undefined
    ? { _id: row.blood_bank_id, name: row.bb_name, city: row.bb_city }
    : row.blood_bank_id;

  return {
    _id: row.id,
    userId,
    bloodBankId,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_POPULATED = `
  SELECT f.*,
         u.name AS u_name, u.email AS u_email, u.blood_group AS u_blood_group,
         bb.name AS bb_name, bb.city AS bb_city
  FROM feedback f
  LEFT JOIN users u ON u.id = f.user_id
  LEFT JOIN blood_banks bb ON bb.id = f.blood_bank_id
`;

async function findExisting(userId, bloodBankId) {
  if (!isValidUuid(userId) || !isValidUuid(bloodBankId)) return null;
  const { rows } = await query(
    'SELECT * FROM feedback WHERE user_id = $1 AND blood_bank_id = $2 LIMIT 1',
    [userId, bloodBankId]
  );
  return formatFeedback(rows[0]);
}

async function create({ userId, bloodBankId, rating, comment = null }) {
  const { rows } = await query(
    `INSERT INTO feedback (user_id, blood_bank_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, bloodBankId, Number(rating), comment ? String(comment).trim() : null]
  );
  const { rows: populated } = await query(`${SELECT_POPULATED} WHERE f.id = $1`, [rows[0].id]);
  return formatFeedback(populated[0]);
}

async function findAll({ bloodBankId, rating } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (bloodBankId) {
    if (!isValidUuid(bloodBankId)) return [];
    conditions.push(`f.blood_bank_id = $${idx++}`);
    params.push(bloodBankId);
  }
  if (rating) {
    conditions.push(`f.rating = $${idx++}`);
    params.push(parseInt(rating, 10));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`${SELECT_POPULATED} ${where} ORDER BY f.created_at DESC`, params);
  return rows.map(formatFeedback);
}

async function deleteById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query('DELETE FROM feedback WHERE id = $1 RETURNING *', [id]);
  return formatFeedback(rows[0]);
}

async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM feedback');
  return rows[0].count;
}

module.exports = {
  formatFeedback,
  findExisting,
  create,
  findAll,
  deleteById,
  count,
};
