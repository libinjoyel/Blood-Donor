const { query, isValidUuid } = require('../config/db');

function formatDonation(row) {
  if (!row) return null;
  const userId = row.u_name !== undefined
    ? { _id: row.user_id, name: row.u_name, bloodGroup: row.u_blood_group }
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
    donationDate: row.donation_date,
    bloodGroup: row.blood_group,
    units: row.units,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_POPULATED = `
  SELECT d.*,
         u.name AS u_name, u.blood_group AS u_blood_group,
         bb.name AS bb_name, bb.city AS bb_city, bb.address AS bb_address, bb.phone AS bb_phone
  FROM donation_history d
  LEFT JOIN users u ON u.id = d.user_id
  LEFT JOIN blood_banks bb ON bb.id = d.blood_bank_id
`;

async function create({ userId, bloodBankId, donationDate, bloodGroup, units = 1, status = 'completed', notes = null }) {
  const { rows } = await query(
    `INSERT INTO donation_history (user_id, blood_bank_id, donation_date, blood_group, units, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, bloodBankId, donationDate, bloodGroup, units, status, notes ? String(notes).trim() : null]
  );
  return formatDonation(rows[0]);
}

async function findByUser(userId) {
  if (!isValidUuid(userId)) return [];
  const { rows } = await query(
    `${SELECT_POPULATED} WHERE d.user_id = $1 ORDER BY d.donation_date DESC`,
    [userId]
  );
  return rows.map(formatDonation);
}

async function findOneForUser(id, userId) {
  if (!isValidUuid(id) || !isValidUuid(userId)) return null;
  const { rows } = await query(
    `${SELECT_POPULATED} WHERE d.id = $1 AND d.user_id = $2`,
    [id, userId]
  );
  return formatDonation(rows[0]);
}

async function findRecent(limit = 5) {
  const { rows } = await query(
    `${SELECT_POPULATED} ORDER BY d.created_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(formatDonation);
}

async function countCompleted() {
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM donation_history WHERE status = 'completed'`);
  return rows[0].count;
}

async function getMonthlyDonations(sinceDate) {
  const { rows } = await query(
    `SELECT TO_CHAR(donation_date AT TIME ZONE 'UTC', 'YYYY-MM') AS _id, COALESCE(SUM(units), 0)::int AS count
     FROM donation_history
     WHERE donation_date >= $1 AND status = 'completed'
     GROUP BY _id`,
    [sinceDate]
  );
  return rows;
}

module.exports = {
  formatDonation,
  create,
  findByUser,
  findOneForUser,
  findRecent,
  countCompleted,
  getMonthlyDonations,
};
