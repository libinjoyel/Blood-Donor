const { query, isValidUuid } = require('../config/db');

function formatUrgentRequest(row) {
  if (!row) return null;
  return {
    _id: row.id,
    hospital: row.hospital,
    bloodGroup: row.blood_group,
    units: row.units,
    city: row.city,
    contact: row.contact,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ hospital, bloodGroup, units, city, contact }) {
  const { rows } = await query(
    `INSERT INTO urgent_requests (hospital, blood_group, units, city, contact, status)
     VALUES ($1, $2, $3, $4, $5, 'urgent')
     RETURNING *`,
    [String(hospital).trim(), bloodGroup, Number(units), String(city).trim(), String(contact).trim()]
  );
  return formatUrgentRequest(rows[0]);
}

async function findAll({ search, bloodGroup, city, status, limit } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(hospital ILIKE $${idx} OR city ILIKE $${idx} OR contact ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (bloodGroup) {
    conditions.push(`blood_group = $${idx++}`);
    params.push(bloodGroup);
  }
  if (city) {
    conditions.push(`city ILIKE $${idx++}`);
    params.push(`%${city}%`);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';
  const { rows } = await query(`SELECT * FROM urgent_requests ${where} ORDER BY created_at DESC ${limitClause}`, params);
  return rows.map(formatUrgentRequest);
}

async function updateById(id, updates) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.hospital !== undefined) { fields.push(`hospital = $${idx++}`); values.push(String(updates.hospital).trim()); }
  if (updates.bloodGroup !== undefined) { fields.push(`blood_group = $${idx++}`); values.push(updates.bloodGroup); }
  if (updates.units !== undefined) { fields.push(`units = $${idx++}`); values.push(Number(updates.units)); }
  if (updates.city !== undefined) { fields.push(`city = $${idx++}`); values.push(String(updates.city).trim()); }
  if (updates.contact !== undefined) { fields.push(`contact = $${idx++}`); values.push(String(updates.contact).trim()); }
  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }

  if (fields.length === 0) {
    const { rows } = await query('SELECT * FROM urgent_requests WHERE id = $1', [id]);
    return formatUrgentRequest(rows[0]);
  }

  fields.push('updated_at = NOW()');
  values.push(id);
  const { rows } = await query(`UPDATE urgent_requests SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  return formatUrgentRequest(rows[0]);
}

async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM urgent_requests');
  return rows[0].count;
}

module.exports = {
  formatUrgentRequest,
  create,
  findAll,
  updateById,
  count,
};
