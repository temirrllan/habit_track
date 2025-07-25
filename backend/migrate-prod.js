require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Скопируй полный URL из Railway (со всеми звездочками заменёнными на реальный пароль)
const DATABASE_URL = 'postgresql://postgres:YAMcWkigCPoTJghxoWZPktzASqhFcqbq@tramway.proxy.rlwy.net:50447/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // Проверяем подключение
    console.log('Connecting to Railway PostgreSQL...');
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully:', test.rows[0].now);
    
    // Сначала выполняем schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema migrations...');
    await pool.query(schema);
    console.log('✅ Schema created successfully!');
    
    // Затем выполняем seeds отдельно
    const seedsPath = path.join(__dirname, '../database/seeds.sql');
    const seeds = fs.readFileSync(seedsPath, 'utf8');
    
    console.log('Running seeds...');
    
    // Выполняем seeds по одному запросу
    const seedQueries = seeds.split(';').filter(query => query.trim());
    
    for (let i = 0; i < seedQueries.length; i++) {
      const query = seedQueries[i].trim();
      if (query) {
        console.log(`Executing seed ${i + 1}/${seedQueries.length}...`);
        await pool.query(query);
      }
    }
    
    console.log('✅ Seeds inserted successfully!');
    
    // Проверяем что данные добавились
    const categories = await pool.query('SELECT * FROM categories');
    console.log('📁 Categories added:', categories.rows.length);
    
    const messages = await pool.query('SELECT * FROM motivational_messages');
    console.log('💬 Messages added:', messages.rows.length);
    
    await pool.end();
    console.log('✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();