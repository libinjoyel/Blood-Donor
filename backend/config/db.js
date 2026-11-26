const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Pool, Client } = require('pg');

const backendEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');
const rootEnvLocal = path.resolve(__dirname, '../../.env.local');

if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv, override: true });
if (fs.existsSync(rootEnvLocal)) dotenv.config({ path: rootEnvLocal, override: true });

function normalizeSslMode(url) {
  if (!url) return url;
  return url.replace(/sslmode=require\b/i, 'sslmode=verify-full');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Run `neon deploy` to pull Neon Postgres env vars.');
}

const pool = new Pool({
  connectionString: normalizeSslMode(process.env.DATABASE_URL),
  min: 2,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function createDirectClient() {
  const connectionString = normalizeSslMode(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  return new Client({ connectionString });
}

module.exports = {
  pool,
  query,
  withTransaction,
  createDirectClient,
  isValidUuid,
};
