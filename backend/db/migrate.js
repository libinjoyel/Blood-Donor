const fs = require('fs');
const path = require('path');
const { createDirectClient } = require('../config/db');

async function runMigrations() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = createDirectClient();
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('PostgreSQL schema migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('PostgreSQL schema migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
