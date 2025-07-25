require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./config');

async function migrate() {
  try {
    // Читаем schema.sql
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Читаем seeds.sql
    const seedsPath = path.join(__dirname, '../../../database/seeds.sql');
    const seeds = fs.readFileSync(seedsPath, 'utf8');
    
    console.log('Running migrations...');
    await pool.query(schema);
    console.log('Schema created successfully!');
    
    console.log('Running seeds...');
    await pool.query(seeds);
    console.log('Seeds inserted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();