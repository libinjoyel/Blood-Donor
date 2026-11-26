const { query, isValidUuid } = require('../config/db');

function formatRole(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    description: row.description ?? '',
    permissions: row.permissions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findOne() {
  const { rows } = await query('SELECT * FROM roles LIMIT 1');
  return formatRole(rows[0]);
}

async function findAll() {
  const { rows } = await query('SELECT * FROM roles ORDER BY created_at DESC');
  return rows.map(formatRole);
}

async function create({ name, description = '', permissions = [] }) {
  const { rows } = await query(
    `INSERT INTO roles (name, description, permissions)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [String(name).trim(), String(description).trim(), Array.isArray(permissions) ? permissions : []]
  );
  return formatRole(rows[0]);
}

async function insertMany(items) {
  const inserted = [];
  for (const item of items) {
    const row = await create(item);
    inserted.push(row);
  }
  return inserted;
}

async function updateById(id, updates) {
  if (!isValidUuid(id)) return null;
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(String(updates.name).trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(String(updates.description).trim());
  }
  if (updates.permissions !== undefined) {
    fields.push(`permissions = $${idx++}`);
    values.push(Array.isArray(updates.permissions) ? updates.permissions : []);
  }

  if (fields.length === 0) {
    const { rows } = await query('SELECT * FROM roles WHERE id = $1', [id]);
    return formatRole(rows[0]);
  }

  fields.push('updated_at = NOW()');
  values.push(id);
  const { rows } = await query(
    `UPDATE roles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return formatRole(rows[0]);
}

async function deleteById(id) {
  if (!isValidUuid(id)) return null;
  const { rows } = await query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
  return formatRole(rows[0]);
}

module.exports = {
  formatRole,
  findOne,
  findAll,
  create,
  insertMany,
  updateById,
  deleteById,
};
