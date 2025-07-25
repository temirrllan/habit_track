import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import './App.css';

interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  username: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Инициализируем Telegram WebApp
    WebApp.ready();
    
    // Получаем данные пользователя из Telegram
    const tgUser = WebApp.initDataUnsafe.user;
    
    if (tgUser) {
      // Отправляем данные на backend
      fetch(`${process.env.REACT_APP_API_URL}/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tgUser)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Auth error:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Habit Tracker</h1>
        {user ? (
          <div>
            <p>Welcome, {user.first_name}!</p>
            <p>Your Telegram ID: {user.telegram_id}</p>
          </div>
        ) : (
          <p>Please open this app from Telegram</p>
        )}
      </header>
    </div>
  );
}

export default App;