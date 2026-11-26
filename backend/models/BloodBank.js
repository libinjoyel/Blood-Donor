const { query, isValidUuid } = require('../config/db');

function formatBloodBank(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    latitude: row.latitude,
    longitude: row.longitude,
    services: row.services ?? [],
    workingHours: row.working_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findOne() {
  const { rows } = await query('SELECT * FROM blood_banks LIMIT 1');
  return formatBloodBank(rows[0]);
}

async function count() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM blood_banks');
  return rows[0].count;
}

async function findById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query('SELECT * FROM blood_banks WHERE id = $1', [id]);
  return formatBloodBank(rows[0]);
}

async function findAll({ search, city, service, sort } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${idx} OR city ILIKE $${idx} OR address ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (city) {
    conditions.push(`city ILIKE $${idx}`);
    params.push(`%${city}%`);
    idx++;
  }
  if (service) {
    conditions.push(`EXISTS (SELECT 1 FROM unnest(services) AS s WHERE s ILIKE $${idx})`);
    params.push(`%${service}%`);
    idx++;
  }

  let orderBy = 'name ASC';
  if (sort === 'city') orderBy = 'city ASC, name ASC';
  if (sort === '-name') orderBy = 'name DESC';
  if (sort === '-city') orderBy = 'city DESC, name ASC';

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT * FROM blood_banks ${where} ORDER BY ${orderBy}`, params);
  return rows.map(formatBloodBank);
}

async function create({ name, address, city, phone, email, latitude, longitude, services = [], workingHours }) {
  const { rows } = await query(
    `INSERT INTO blood_banks (name, address, city, phone, email, latitude, longitude, services, working_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      String(name).trim(),
      String(address).trim(),
      String(city).trim(),
      String(phone).trim(),
      email ? String(email).trim().toLowerCase() : null,
      latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude !== undefined && longitude !== null ? Number(longitude) : null,
      Array.isArray(services) ? services : [],
      workingHours ? String(workingHours).trim() : null,
    ]
  );
  return formatBloodBank(rows[0]);
}

async function insertMany(items) {
  const inserted = [];
  for (const item of items) {
    inserted.push(await create(item));
  }
  return inserted;
}

async function updateById(id, updates) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(String(updates.name).trim()); }
  if (updates.address !== undefined) { fields.push(`address = $${idx++}`); values.push(String(updates.address).trim()); }
  if (updates.city !== undefined) { fields.push(`city = $${idx++}`); values.push(String(updates.city).trim()); }
  if (updates.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(String(updates.phone).trim()); }
  if (updates.email !== undefined) { fields.push(`email = $${idx++}`); values.push(updates.email ? String(updates.email).trim().toLowerCase() : null); }
  if (updates.latitude !== undefined) { fields.push(`latitude = $${idx++}`); values.push(updates.latitude); }
  if (updates.longitude !== undefined) { fields.push(`longitude = $${idx++}`); values.push(updates.longitude); }
  if (updates.services !== undefined) { fields.push(`services = $${idx++}`); values.push(Array.isArray(updates.services) ? updates.services : []); }
  if (updates.workingHours !== undefined) { fields.push(`working_hours = $${idx++}`); values.push(updates.workingHours ? String(updates.workingHours).trim() : null); }

  if (fields.length === 0) return findById(id);

  fields.push('updated_at = NOW()');
  values.push(id);
  const { rows } = await query(`UPDATE blood_banks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  return formatBloodBank(rows[0]);
}

async function deleteById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query('DELETE FROM blood_banks WHERE id = $1 RETURNING *', [id]);
  return formatBloodBank(rows[0]);
}

module.exports = {
  formatBloodBank,
  findOne,
  count,
  findById,
  findAll,
  create,
  insertMany,
  updateById,
  deleteById,
};
