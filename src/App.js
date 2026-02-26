import React, { useState, useEffect } from 'react';
import './App.css';
import Game from './components/Game';
import StartScreen from './components/StartScreen';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [screen, setScreen] = useState('start'); // start | game
  const [language, setLanguage] = useState('ru'); // ru | sah
  const [theme, setTheme] = useState('light'); // light | dark
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [mode, setMode] = useState('all'); // all | yakutsk

  useEffect(() => {
    const key = process.env.REACT_APP_GMAPS_API_KEY;
    if (!key) {
      console.error('API ключ не найден в переменных окружения');
      return;
    }
    setApiKey(key);
    loadGoogleMapsAPI(key);
  }, []);
  
  const loadGoogleMapsAPI = (key) => {
    if (window.google) {
      setMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=$%7Bkey%7D&loading=async&libraries=places,streetView`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapsLoaded(true);
    };
    script.onerror = () => {
      console.error('Ошибка загрузки Google Maps API');
    };
    document.head.appendChild(script);
  };

  const handleStart = () => {
    setScreen('game');
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ru' ? 'sah' : 'ru'));
  };

  const resetGame = () => {
    setScreen('start');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!apiKey || !mapsLoaded) {
    return <div className="loading">Загрузка карт...</div>;
  }

  const langLabel = language === 'ru' ? 'Язык: Русский' : 'Язык: Саха';
  const themeLabel = theme === 'dark' ? 'Светлый режим' : 'Тёмный режим';
  const timerLabel = timerEnabled ? 'Таймер: Вкл' : 'Таймер: Выкл';
  const modeLabel = mode === 'yakutsk' ? 'Режим: Только Якутск' : 'Режим: Вся Якутия';

  return (
    <div className={`App theme-${theme}`}>
      {screen === 'start' && (
        <StartScreen
          onStart={handleStart}
          language={language}
          mode={mode}
          onChangeMode={setMode}
        />
      )}
      {screen === 'game' && (
        <Game
          onReset={resetGame}
          language={language}
          theme={theme}
          timerEnabled={timerEnabled}
          mode={mode}
        />
      )}

      {/* Глобальные настройки (шестерёнка) — доступны на всех экранах */}
      <div className="settings-fab">
        <input id="settings-toggle" type="checkbox" className="settings-toggle-input" />
        <label htmlFor="settings-toggle" className="settings-fab-button">
          ⚙
        </label>
        <div className="settings-panel">
          <button
            type="button"
            className="settings-item"
            onClick={toggleTheme}
          >
            {themeLabel}
          </button>
          <button
            type="button"
            className="settings-item"
            onClick={toggleLanguage}
          >
            {langLabel}
          </button>
          <button
            type="button"
            className="settings-item"
            onClick={() => setTimerEnabled(prev => !prev)}
          >
            {timerLabel}
          </button>
          <button
            type="button"
            className="settings-item"
            onClick={() => setMode(prev => (prev === 'yakutsk' ? 'all' : 'yakutsk'))}
          >
            {modeLabel}
          </button>
          <a
            href="https://t.me/alpinisti4"
            target="_blank"
            rel="noopener noreferrer"
            className="settings-item settings-link"
          >
            Связаться с нами
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;

