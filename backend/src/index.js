// Загружаем .env только если файл существует
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '../.env'))) {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { pool } = require('./db/config');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false  // В production CORS не нужен
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Проверка подключения к БД
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0].now);
  }
});

// API роуты
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Роут для авторизации через Telegram
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, language_code } = req.body;
    
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
      error: 'Internal server error' 
    });
  }
});

// В продакшене сервируем React build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});