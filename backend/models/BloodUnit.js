const { query, isValidUuid } = require('../config/db');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];
const STATUSES = ['Available', 'Reserved', 'Issued', 'Expired', 'Discarded'];

function formatBloodUnit(row) {
  if (!row) return null;
  const donor = row.donor_id
    ? (row.donor_name !== undefined
        ? {
            _id: row.donor_id,
            name: row.donor_name,
            email: row.donor_email,
            phone: row.donor_phone,
            bloodGroup: row.donor_blood_group,
          }
        : row.donor_id)
    : undefined;

  return {
    _id: row.id,
    unitId: row.unit_id,
    donor,
    bloodGroup: row.blood_group,
    component: row.component,
    donationDate: row.donation_date,
    expiryDate: row.expiry_date,
    status: row.status,
    storageLocation: row.storage_location ?? '',
    barcode: row.barcode,
    remarks: row.remarks ?? '',
    reservedFor: row.reserved_for,
    reservedAt: row.reserved_at,
    issuedTo: row.issued_to,
    issuedAt: row.issued_at,
    discardedAt: row.discarded_at,
    discardedReason: row.discarded_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_WITH_DONOR = `
  SELECT bu.*,
         u.name AS donor_name,
         u.email AS donor_email,
         u.phone AS donor_phone,
         u.blood_group AS donor_blood_group
  FROM blood_units bu
  LEFT JOIN users u ON u.id = bu.donor_id
`;

async function findAll({ search, bloodGroup, component, status, storageLocation, donationDateStart, donationDateEnd, expiryDateStart, expiryDateEnd } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(bu.unit_id ILIKE $${idx} OR bu.barcode ILIKE $${idx} OR bu.storage_location ILIKE $${idx} OR bu.remarks ILIKE $${idx} OR bu.reserved_for ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (bloodGroup) {
    conditions.push(`bu.blood_group = $${idx++}`);
    params.push(bloodGroup);
  }
  if (component) {
    conditions.push(`bu.component = $${idx++}`);
    params.push(component);
  }
  if (status) {
    conditions.push(`bu.status = $${idx++}`);
    params.push(status);
  }
  if (storageLocation) {
    conditions.push(`bu.storage_location ILIKE $${idx++}`);
    params.push(`%${storageLocation}%`);
  }
  if (donationDateStart && donationDateEnd) {
    conditions.push(`bu.donation_date >= $${idx++} AND bu.donation_date < $${idx++}`);
    params.push(donationDateStart, donationDateEnd);
  }
  if (expiryDateStart && expiryDateEnd) {
    conditions.push(`bu.expiry_date >= $${idx++} AND bu.expiry_date < $${idx++}`);
    params.push(expiryDateStart, expiryDateEnd);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`${SELECT_WITH_DONOR} ${where} ORDER BY bu.created_at DESC`, params);
  return rows.map(formatBloodUnit);
}

async function findById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query(`${SELECT_WITH_DONOR} WHERE bu.id = $1`, [id]);
  return formatBloodUnit(rows[0]);
}

async function create({ bloodGroup, component, donationDate, expiryDate, storageLocation = '', remarks = '', donorId = null }) {
  const { rows: seqRows } = await query(`SELECT nextval('blood_unit_seq')::int AS seq`);
  const seq = seqRows[0].seq;
  const unitId = `BLD${String(seq).padStart(6, '0')}`;
  const barcode = `LF${String(seq).padStart(6, '0')}`;

  const { rows } = await query(
    `INSERT INTO blood_units (unit_id, donor_id, blood_group, component, donation_date, expiry_date, status, storage_location, barcode, remarks)
     VALUES ($1, $2, $3, $4, $5, $6, 'Available', $7, $8, $9)
     RETURNING *`,
    [
      unitId,
      donorId || null,
      bloodGroup,
      component,
      donationDate,
      expiryDate,
      storageLocation ? String(storageLocation).trim() : '',
      barcode,
      remarks ? String(remarks).trim() : '',
    ]
  );
  return formatBloodUnit(rows[0]);
}

async function updateById(id, updates) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.bloodGroup !== undefined) { fields.push(`blood_group = $${idx++}`); values.push(updates.bloodGroup); }
  if (updates.component !== undefined) { fields.push(`component = $${idx++}`); values.push(updates.component); }
  if (updates.donationDate !== undefined) { fields.push(`donation_date = $${idx++}`); values.push(updates.donationDate); }
  if (updates.expiryDate !== undefined) { fields.push(`expiry_date = $${idx++}`); values.push(updates.expiryDate); }
  if (updates.storageLocation !== undefined) { fields.push(`storage_location = $${idx++}`); values.push(String(updates.storageLocation).trim()); }
  if (updates.remarks !== undefined) { fields.push(`remarks = $${idx++}`); values.push(String(updates.remarks).trim()); }
  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
  if (updates.reservedFor !== undefined) { fields.push(`reserved_for = $${idx++}`); values.push(updates.reservedFor); }
  if (updates.reservedAt !== undefined) { fields.push(`reserved_at = $${idx++}`); values.push(updates.reservedAt); }
  if (updates.issuedTo !== undefined) { fields.push(`issued_to = $${idx++}`); values.push(JSON.stringify(updates.issuedTo)); }
  if (updates.issuedAt !== undefined) { fields.push(`issued_at = $${idx++}`); values.push(updates.issuedAt); }
  if (updates.discardedAt !== undefined) { fields.push(`discarded_at = $${idx++}`); values.push(updates.discardedAt); }
  if (updates.discardedReason !== undefined) { fields.push(`discarded_reason = $${idx++}`); values.push(updates.discardedReason); }

  if (fields.length === 0) return findById(id);

  fields.push('updated_at = NOW()');
  values.push(id);
  const { rows } = await query(`UPDATE blood_units SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`, values);
  if (!rows[0]) return null;
  return findById(rows[0].id);
}

async function deleteById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query('DELETE FROM blood_units WHERE id = $1 RETURNING *', [id]);
  return formatBloodUnit(rows[0]);
}

async function expirePendingUnits(now) {
  const { rows } = await query(
    `UPDATE blood_units
     SET status = 'Expired', updated_at = NOW()
     WHERE status IN ('Available', 'Reserved') AND expiry_date < $1
     RETURNING *`,
    [now]
  );
  return rows.map(formatBloodUnit);
}

async function countExpiringBetween(start, end) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM blood_units
     WHERE status IN ('Available', 'Reserved') AND expiry_date >= $1 AND expiry_date <= $2`,
    [start, end]
  );
  return rows[0].count;
}

async function countIssuedBetween(start, end) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM blood_units
     WHERE status = 'Issued' AND issued_at >= $1 AND issued_at < $2`,
    [start, end]
  );
  return rows[0].count;
}

async function getDistinctLocations() {
  const { rows } = await query(
    `SELECT DISTINCT storage_location FROM blood_units
     WHERE storage_location IS NOT NULL AND storage_location <> ''
     ORDER BY storage_location ASC`
  );
  return rows.map((r) => r.storage_location);
}

async function getMonthlyUsage(sinceDate) {
  const { rows } = await query(
    `SELECT TO_CHAR(issued_at AT TIME ZONE 'UTC', 'YYYY-MM') AS _id, COUNT(*)::int AS count
     FROM blood_units
     WHERE status = 'Issued' AND issued_at IS NOT NULL AND issued_at >= $1
     GROUP BY _id`,
    [sinceDate]
  );
  return rows;
}

async function getExpiryTrendAgg() {
  const { rows } = await query(
    `SELECT TO_CHAR(expiry_date AT TIME ZONE 'UTC', 'YYYY-MM') AS _id, COUNT(*)::int AS count
     FROM blood_units
     WHERE status IN ('Available', 'Reserved') AND expiry_date IS NOT NULL
     GROUP BY _id`
  );
  return rows;
}

module.exports = {
  BLOOD_GROUPS,
  COMPONENTS,
  STATUSES,
  formatBloodUnit,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  expirePendingUnits,
  countExpiringBetween,
  countIssuedBetween,
  getDistinctLocations,
  getMonthlyUsage,
  getExpiryTrendAgg,
};
