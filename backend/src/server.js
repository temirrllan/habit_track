const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Создаем pool для БД напрямую
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware - упрощаем CORS
app.use(cors());
app.use(express.json());

// Тестовый роут
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    env: process.env.NODE_ENV,
    port: PORT
  });
});

// API роуты
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      timestamp: new Date(),
      db_time: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed'
    });
  }
});

// Роут для авторизации через Telegram
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, language_code } = req.body;
    
    console.log('Auth request:', { id, first_name, username });
    
    const query = `
      INSERT INTO users (telegram_id, first_name, last_name, username, language_code)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        language_code = EXCLUDED.language_code,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [id, first_name, last_name, username, language_code || 'en'];
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Статические файлы React в продакшене
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../frontend/build');
  
  // Проверяем существует ли папка build
  const fs = require('fs');
  if (fs.existsSync(buildPath)) {
    console.log('Serving static files from:', buildPath);
    app.use(express.static(buildPath));
    
    // Все остальные роуты -> index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    console.error('Build folder not found at:', buildPath);
  }
}

// Запуск сервера
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    🚀 Server is running!
    📍 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});