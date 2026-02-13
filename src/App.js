import React, { useState, useEffect } from 'react';
import './App.css';
import Game from './components/Game';
import StartScreen from './components/StartScreen';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [screen, setScreen] = useState('start'); // start | game
  const [language, setLanguage] = useState('ru'); // ru | sah

  useEffect(() => {
    // Загружаем API ключ
    fetch('/tocenJS.txt')
      .then(response => response.text())
      .then(key => {
        const trimmedKey = key.trim();
        setApiKey(trimmedKey);
        loadGoogleMapsAPI(trimmedKey);
      })
      .catch(err => console.error('Ошибка загрузки API ключа:', err));
  }, []);

  const loadGoogleMapsAPI = (key) => {
    if (window.google) {
      setMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
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

  if (!apiKey || !mapsLoaded) {
    return <div className="loading">Загрузка карт...</div>;
  }

  return (
    <div className="App">
      {screen === 'start' && (
        <StartScreen
          onStart={handleStart}
          language={language}
          onToggleLanguage={toggleLanguage}
        />
      )}
      {screen === 'game' && (
        <Game
          onReset={resetGame}
          language={language}
        />
      )}
    </div>
  );
}

export default App;

