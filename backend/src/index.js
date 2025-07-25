require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db/config');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Базовый роут
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Роут для авторизации через Telegram
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, language_code } = req.body;
    
    // Создаем или обновляем пользователя
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});