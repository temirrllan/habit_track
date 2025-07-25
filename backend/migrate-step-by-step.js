const { Pool } = require('pg');

// Вставь свой DATABASE_URL из Railway
const DATABASE_URL = 'postgresql://postgres:YAMcWkigCPoTJghxoWZPktzASqhFcqbq@tramway.proxy.rlwy.net:50447/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🔄 Starting step-by-step migration...\n');
    
    // Удаляем существующие таблицы
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS habit_marks CASCADE');
    await pool.query('DROP TABLE IF EXISTS reminders CASCADE');
    await pool.query('DROP TABLE IF EXISTS habits CASCADE');
    await pool.query('DROP TABLE IF EXISTS subscriptions CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS categories CASCADE');
    await pool.query('DROP TABLE IF EXISTS motivational_messages CASCADE');
    console.log('✅ Tables dropped\n');
    
    // Создаем таблицы по одной
    console.log('📋 Creating categories table...');
    await pool.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ categories created');
    
    console.log('📋 Creating motivational_messages table...');
    await pool.query(`
      CREATE TABLE motivational_messages (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        language VARCHAR(2) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ motivational_messages created');
    
    console.log('📋 Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        language_code VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ users created');
    
    console.log('📋 Creating subscriptions table...');
    await pool.query(`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        starts_at TIMESTAMP NOT NULL,
        ends_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ subscriptions created');
    
    console.log('📋 Creating habits table...');
    await pool.query(`
      CREATE TABLE habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id),
        title VARCHAR(255) NOT NULL,
        goal VARCHAR(255),
        reminder_time TIME NOT NULL,
        is_bad_habit BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ habits created');
    
    console.log('📋 Creating habit_marks table...');
    await pool.query(`
      CREATE TABLE habit_marks (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('done', 'undone', 'skipped')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, date)
      )
    `);
    console.log('✅ habit_marks created');
    
    // Создаем индексы
    console.log('\n📊 Creating indexes...');
    await pool.query('CREATE INDEX idx_users_telegram_id ON users(telegram_id)');
    await pool.query('CREATE INDEX idx_habits_user_id ON habits(user_id)');
    await pool.query('CREATE INDEX idx_habit_marks_habit_id ON habit_marks(habit_id)');
    await pool.query('CREATE INDEX idx_habit_marks_date ON habit_marks(date)');
    console.log('✅ Indexes created\n');
    
    // Добавляем начальные данные
    console.log('🌱 Adding seed data...');
    
    console.log('Adding categories...');
    await pool.query(`
      INSERT INTO categories (name, emoji, color) VALUES
      ('Sport', '🏃', '#FF6B6B'),
      ('Health', '💧', '#4ECDC4'),
      ('Education', '📚', '#45B7D1'),
      ('Mindfulness', '🧘', '#96CEB4'),
      ('Productivity', '🎯', '#FECA57')
    `);
    console.log('✅ Categories added');
    
    console.log('Adding motivational messages...');
    await pool.query(`
      INSERT INTO motivational_messages (message, language) VALUES
      ('Yes U Can!', 'en'),
      ('Keep going!', 'en'),
      ('You''re doing great!', 'en'),
      ('Stay strong!', 'en'),
      ('Never give up!', 'en'),
      ('Ты справишься!', 'ru'),
      ('Так держать!', 'ru'),
      ('Продолжай в том же духе!', 'ru'),
      ('Не сдавайся!', 'ru'),
      ('Ты молодец!', 'ru')
    `);
    console.log('✅ Messages added\n');
    
    // Проверяем результат
    console.log('📊 Checking results...');
    const categories = await pool.query('SELECT COUNT(*) FROM categories');
    const messages = await pool.query('SELECT COUNT(*) FROM motivational_messages');
    
    console.log(`✅ Categories: ${categories.rows[0].count}`);
    console.log(`✅ Messages: ${messages.rows[0].count}`);
    
    console.log('\n🎉 Migration completed successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error('Details:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();