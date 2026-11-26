const { query, isValidUuid } = require('../config/db');

function formatAppointment(row) {
  if (!row) return null;
  const userId = row.u_name !== undefined
    ? {
        _id: row.user_id,
        name: row.u_name,
        email: row.u_email,
        phone: row.u_phone,
        bloodGroup: row.u_blood_group,
      }
    : row.user_id;

  const bloodBankId = row.bb_name !== undefined
    ? {
        _id: row.blood_bank_id,
        name: row.bb_name,
        city: row.bb_city,
        address: row.bb_address,
        phone: row.bb_phone,
      }
    : row.blood_bank_id;

  return {
    _id: row.id,
    userId,
    bloodBankId,
    date: row.date,
    time: row.time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_POPULATED = `
  SELECT a.*,
         u.name AS u_name, u.email AS u_email, u.phone AS u_phone, u.blood_group AS u_blood_group,
         bb.name AS bb_name, bb.city AS bb_city, bb.address AS bb_address, bb.phone AS bb_phone
  FROM appointments a
  LEFT JOIN users u ON u.id = a.user_id
  LEFT JOIN blood_banks bb ON bb.id = a.blood_bank_id
`;

async function findExistingScheduled({ userId, bloodBankId, date, time }) {
  if (!isValidUuid(userId) || !isValidUuid(bloodBankId)) return null;
  const { rows } = await query(
    `SELECT * FROM appointments
     WHERE user_id = $1 AND blood_bank_id = $2 AND date = $3 AND time = $4 AND status = 'scheduled'
     LIMIT 1`,
    [userId, bloodBankId, date, time]
  );
  return formatAppointment(rows[0]);
}

async function create({ userId, bloodBankId, date, time }) {
  const { rows } = await query(
    `INSERT INTO appointments (user_id, blood_bank_id, date, time, status)
     VALUES ($1, $2, $3, $4, 'scheduled')
     RETURNING id`,
    [userId, bloodBankId, date, time]
  );
  return findById(rows[0].id);
}

async function findById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query(`${SELECT_POPULATED} WHERE a.id = $1`, [id]);
  return formatAppointment(rows[0]);
}

async function findOneScheduledForUser(id, userId) {
  if (!isValidUuid(id) || !isValidUuid(userId)) return null;
  const { rows } = await query(
    `${SELECT_POPULATED} WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'scheduled'`,
    [id, userId]
  );
  return formatAppointment(rows[0]);
}

async function cancelForUser(id, userId) {
  if (!isValidUuid(id) || !isValidUuid(userId)) return null;
  const { rows } = await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'scheduled'
     RETURNING *`,
    [id, userId]
  );
  return formatAppointment(rows[0]);
}

async function rescheduleForUser(id, userId, { date, time }) {
  if (!isValidUuid(id) || !isValidUuid(userId)) return null;
  const { rows } = await query(
    `UPDATE appointments SET date = $1, time = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4 AND status = 'scheduled'
     RETURNING id`,
    [date, time, id, userId]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
}

async function markCompleted(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query(
    `UPDATE appointments SET status = 'completed', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!rows[0]) return null;
  return findById(rows[0].id);
}

async function findByUser(userId) {
  if (!isValidUuid(userId)) return [];
  const { rows } = await query(
    `${SELECT_POPULATED} WHERE a.user_id = $1 ORDER BY a.date DESC, a.time DESC`,
    [userId]
  );
  return rows.map(formatAppointment);
}

async function findAll({ status, userId, bloodBankId, limit } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }
  if (userId) {
    if (!isValidUuid(userId)) return [];
    conditions.push(`a.user_id = $${idx++}`);
    params.push(userId);
  }
  if (bloodBankId) {
    if (!isValidUuid(bloodBankId)) return [];
    conditions.push(`a.blood_bank_id = $${idx++}`);
    params.push(bloodBankId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';
  const { rows } = await query(`${SELECT_POPULATED} ${where} ORDER BY a.created_at DESC ${limitClause}`, params);
  return rows.map(formatAppointment);
}

async function updateById(id, { status, date, time }) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (status) { fields.push(`status = $${idx++}`); values.push(status); }
  if (date) { fields.push(`date = $${idx++}`); values.push(date); }
  if (time) { fields.push(`time = $${idx++}`); values.push(time); }

  if (fields.length === 0) return findById(id);

  fields.push('updated_at = NOW()');
  values.push(id);
  const { rows } = await query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`, values);
  if (!rows[0]) return null;
  return findById(rows[0].id);
}

async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM appointments');
  return rows[0].count;
}

module.exports = {
  formatAppointment,
  findExistingScheduled,
  create,
  findById,
  findOneScheduledForUser,
  cancelForUser,
  rescheduleForUser,
  markCompleted,
  findByUser,
  findAll,
  updateById,
  count,
};
