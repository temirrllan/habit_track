const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Загружаем .env только если файл существует
if (fs.existsSync(path.join(__dirname, '../../.env'))) {
  require('dotenv').config();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = { pool };