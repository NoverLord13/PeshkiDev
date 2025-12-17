import React, { useState, useEffect } from 'react';
import './App.css';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import ModeSelect from './components/ModeSelect';
import places from './data/places.json';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [screen, setScreen] = useState('start'); // start | mode | game
  const [language, setLanguage] = useState('ru'); // ru | sah

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places,streetView`;
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
    setScreen('mode');
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

