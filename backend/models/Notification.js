const { query, isValidUuid } = require('../config/db');

function formatNotification(row) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    read: row.read,
    link: row.link,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, type, message, link = null }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, message, link)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, type, message, link]
  );
  return formatNotification(rows[0]);
}

async function findByUser(userId) {
  if (!isValidUuid(userId)) return [];
  const { rows } = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(formatNotification);
}

async function countUnread(userId) {
  if (!isValidUuid(userId)) return 0;
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE',
    [userId]
  );
  return rows[0].count;
}

async function markAsRead(id, userId) {
  if (!isValidUuid(id) || !isValidUuid(userId)) return null;
  const { rows } = await query(
    `UPDATE notifications SET read = TRUE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return formatNotification(rows[0]);
}

async function markAllAsRead(userId) {
  if (!isValidUuid(userId)) return;
  await query(
    `UPDATE notifications SET read = TRUE, updated_at = NOW()
     WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );
}

module.exports = {
  formatNotification,
  create,
  findByUser,
  countUnread,
  markAsRead,
  markAllAsRead,
};
