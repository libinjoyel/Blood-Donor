const { query } = require('../config/db');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function formatBloodStock(row) {
  if (!row) return null;
  return {
    _id: row.id,
    bloodGroup: row.blood_group,
    units: row.units,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findAll() {
  const { rows } = await query('SELECT * FROM blood_stock ORDER BY blood_group ASC');
  return rows.map(formatBloodStock);
}

async function ensureAllGroups() {
  const existing = await findAll();
  if (existing.length < BLOOD_GROUPS.length) {
    await query(
      `INSERT INTO blood_stock (blood_group, units)
       SELECT unnest($1::text[]), 0
       ON CONFLICT (blood_group) DO NOTHING`,
      [BLOOD_GROUPS]
    );
    const refreshed = await findAll();
    const byGroup = Object.fromEntries(refreshed.map((s) => [s.bloodGroup, s]));
    return BLOOD_GROUPS.map((g) => byGroup[g]);
  }
  const byGroup = Object.fromEntries(existing.map((s) => [s.bloodGroup, s]));
  return BLOOD_GROUPS.map((g) => byGroup[g]);
}

async function upsertByBloodGroup(bloodGroup, units, updatedBy) {
  const { rows } = await query(
    `INSERT INTO blood_stock (blood_group, units, updated_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (blood_group)
     DO UPDATE SET units = EXCLUDED.units, updated_by = EXCLUDED.updated_by, updated_at = NOW()
     RETURNING *`,
    [bloodGroup, units, updatedBy || null]
  );
  return formatBloodStock(rows[0]);
}

async function decrementIfAvailable(bloodGroup, client = null) {
  const exec = client ? client.query.bind(client) : query;
  const { rows } = await exec(
    `UPDATE blood_stock
     SET units = units - 1, updated_at = NOW()
     WHERE blood_group = $1 AND units > 0
     RETURNING *`,
    [bloodGroup]
  );
  return formatBloodStock(rows[0]);
}

module.exports = {
  BLOOD_GROUPS,
  formatBloodStock,
  findAll,
  ensureAllGroups,
  upsertByBloodGroup,
  decrementIfAvailable,
};
