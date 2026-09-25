const { Pool } = require('pg');
const config = require('../config');
const pool = new Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30000, ssl: config.env === 'production' ? { rejectUnauthorized: false } : undefined });
pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error', error));
module.exports = pool;
