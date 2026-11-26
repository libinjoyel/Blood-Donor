const { query, isValidUuid } = require('../config/db');

function formatTransaction(row) {
  if (!row) return null;
  return {
    _id: row.id,
    bloodUnit: row.blood_unit_id,
    unitId: row.unit_id,
    bloodGroup: row.blood_group,
    action: row.action,
    performedBy: row.performed_by,
    performedByName: row.performed_by_name,
    notes: row.notes ?? '',
    actionDate: row.action_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ bloodUnit, unitId, bloodGroup, action, performedBy = null, performedByName = null, notes = '' }) {
  const { rows } = await query(
    `INSERT INTO blood_transactions (blood_unit_id, unit_id, blood_group, action, performed_by, performed_by_name, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      bloodUnit,
      unitId || null,
      bloodGroup || null,
      action,
      performedBy || null,
      performedByName ? String(performedByName).trim() : null,
      notes ? String(notes).trim() : '',
    ]
  );
  return formatTransaction(rows[0]);
}

async function findAll({ bloodUnit } = {}) {
  const conditions = [];
  const params = [];
  if (bloodUnit) {
    if (!isValidUuid(bloodUnit)) return [];
    conditions.push('blood_unit_id = $1');
    params.push(bloodUnit);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT * FROM blood_transactions ${where} ORDER BY action_date DESC`, params);
  return rows.map(formatTransaction);
}

module.exports = {
  formatTransaction,
  create,
  findAll,
};
