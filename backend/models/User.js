const { query, isValidUuid } = require('../config/db');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const USER_CACHE_TTL_MS = 30000;
const userCache = new Map();

function invalidateUserCache(id) {
  if (id) userCache.delete(String(id));
}

function clearAllUserCache() {
  userCache.clear();
}

function formatUser(row, { includePassword = false } = {}) {
  if (!row) return null;
  const user = {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    bloodGroup: row.blood_group,
    role: row.role,
    adminRole: row.admin_role ?? '',
    address: row.address ?? undefined,
    donationCount: row.donation_count ?? 0,
    isEligible: row.is_eligible,
    lastDonationDate: row.last_donation_date,
    nextAppointment: row.next_appointment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includePassword) {
    user.password = row.password;
  }
  return user;
}

function validateUserFields({ name, email, phone, bloodGroup, role }) {
  if (name !== undefined && !String(name).trim()) {
    const err = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }
  if (email !== undefined && !String(email).trim()) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (phone !== undefined && !String(phone).trim()) {
    const err = new Error('Phone number is required');
    err.statusCode = 400;
    throw err;
  }
  const effectiveRole = role || 'donor';
  if (effectiveRole === 'donor' && bloodGroup !== undefined && !BLOOD_GROUPS.includes(bloodGroup)) {
    const err = new Error('Valid blood group is required for donors');
    err.statusCode = 400;
    throw err;
  }
  if (bloodGroup !== undefined && bloodGroup !== null && bloodGroup !== '' && !BLOOD_GROUPS.includes(bloodGroup)) {
    const err = new Error('Invalid blood group');
    err.statusCode = 400;
    throw err;
  }
}

async function findById(id, options = {}) {
  if (!isValidUuid(id)) return null;
  if (!options.includePassword && !options.bypassCache) {
    const cached = userCache.get(String(id));
    if (cached && Date.now() - cached.ts < USER_CACHE_TTL_MS) {
      return cached.user;
    }
  }
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  const user = formatUser(rows[0], options);
  if (user && !options.includePassword) {
    userCache.set(String(id), { user, ts: Date.now() });
  }
  return user;
}

async function findByEmail(email, options = {}) {
  if (!email) return null;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [String(email).trim().toLowerCase()]);
  return formatUser(rows[0], options);
}

async function create({ name, email, phone, bloodGroup, password, role = 'donor', adminRole = '', address = null, isEligible = true }) {
  validateUserFields({ name, email, phone, bloodGroup: role === 'donor' ? (bloodGroup || '') : bloodGroup, role });
  if (!password) {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedBloodGroup = bloodGroup && BLOOD_GROUPS.includes(bloodGroup) ? bloodGroup : null;
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, blood_group, password, role, admin_role, address, is_eligible)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      String(name).trim(),
      normalizedEmail,
      String(phone).trim(),
      normalizedBloodGroup,
      password,
      role === 'admin' ? 'admin' : 'donor',
      adminRole ? String(adminRole).trim() : '',
      address ? String(address).trim() : null,
      isEligible !== undefined ? Boolean(isEligible) : true,
    ]
  );
  return formatUser(rows[0]);
}

async function updateById(id, updates, { roleFilter } = {}) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(String(updates.name).trim());
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(String(updates.email).trim().toLowerCase());
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${idx++}`);
    values.push(String(updates.phone).trim());
  }
  if (updates.bloodGroup !== undefined) {
    const bg = updates.bloodGroup === '' ? null : updates.bloodGroup;
    if (bg !== null && !BLOOD_GROUPS.includes(bg)) {
      const err = new Error('Invalid blood group');
      err.statusCode = 400;
      throw err;
    }
    fields.push(`blood_group = $${idx++}`);
    values.push(bg);
  }
  if (updates.password !== undefined) {
    fields.push(`password = $${idx++}`);
    values.push(updates.password);
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(updates.role);
  }
  if (updates.adminRole !== undefined) {
    fields.push(`admin_role = $${idx++}`);
    values.push(String(updates.adminRole).trim());
  }
  if (updates.address !== undefined) {
    fields.push(`address = $${idx++}`);
    values.push(updates.address !== null ? String(updates.address).trim() : null);
  }
  if (updates.isEligible !== undefined) {
    fields.push(`is_eligible = $${idx++}`);
    values.push(Boolean(updates.isEligible));
  }
  if (updates.donationCount !== undefined) {
    fields.push(`donation_count = $${idx++}`);
    values.push(updates.donationCount);
  }
  if (updates.lastDonationDate !== undefined) {
    fields.push(`last_donation_date = $${idx++}`);
    values.push(updates.lastDonationDate);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  let sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx++}`;
  if (roleFilter) {
    values.push(roleFilter);
    sql += ` AND role = $${idx++}`;
  }
  sql += ' RETURNING *';

  const { rows } = await query(sql, values);
  invalidateUserCache(id);
  return formatUser(rows[0]);
}

async function deleteById(id, { roleFilter } = {}) {
  if (!isValidUuid(id)) return null;
  const params = [id];
  let sql = 'DELETE FROM users WHERE id = $1';
  if (roleFilter) {
    params.push(roleFilter);
    sql += ' AND role = $2';
  }
  sql += ' RETURNING *';
  const { rows } = await query(sql, params);
  invalidateUserCache(id);
  return formatUser(rows[0]);
}

async function findAll({ search, role, bloodGroup } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    const pattern = `%${search}%`;
    if (role === 'admin') {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx} OR admin_role ILIKE $${idx})`);
    } else {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
    }
    params.push(pattern);
    idx++;
  }
  if (role) {
    conditions.push(`role = $${idx++}`);
    params.push(role);
  }
  if (bloodGroup) {
    conditions.push(`blood_group = $${idx++}`);
    params.push(bloodGroup);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT * FROM users ${where} ORDER BY created_at DESC`, params);
  return rows.map((r) => formatUser(r));
}

async function count(filter = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (filter.role) {
    conditions.push(`role = $${idx++}`);
    params.push(filter.role);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM users ${where}`, params);
  return rows[0].count;
}

async function getBloodGroupStats() {
  const { rows } = await query(
    `SELECT blood_group AS _id, COUNT(*)::int AS count
     FROM users
     WHERE role = 'donor' AND blood_group IS NOT NULL
     GROUP BY blood_group
     ORDER BY blood_group ASC`
  );
  return rows;
}

async function clearAdminRole(roleName) {
  await query(`UPDATE users SET admin_role = '', updated_at = NOW() WHERE admin_role = $1`, [roleName]);
  clearAllUserCache();
}

module.exports = {
  BLOOD_GROUPS,
  formatUser,
  invalidateUserCache,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
  findAll,
  count,
  getBloodGroupStats,
  clearAdminRole,
};
