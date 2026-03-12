import React, { useEffect, useState } from 'react';
import './App.css';
import Game from './components/Game';
import StartScreen from './components/StartScreen';

const MAPS_SCRIPT_ID = 'google-maps-js-api';
let mapsLoaderPromise = null;

function loadGoogleMapsAPI(key) {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  const existingScript = document.getElementById(MAPS_SCRIPT_ID)
    || document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    if (!existingScript.id) {
      existingScript.id = MAPS_SCRIPT_ID;
    }
    mapsLoaderPromise = new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => {
        mapsLoaderPromise = null;
        reject(new Error('Google Maps API script failed to load'));
      }, { once: true });
    });
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mapsLoaderPromise = null;
      reject(new Error('Google Maps API script failed to load'));
    };
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [screen, setScreen] = useState('start'); // start | game
  const [language, setLanguage] = useState('ru'); // ru | sah
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [mode, setMode] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const envKey = process.env.REACT_APP_GMAPS_API_KEY;
    const keyPromise = envKey
      ? Promise.resolve(envKey)
      : fetch('/tocenJS.txt')
        .then((response) => response.text());

    keyPromise
      .then((key) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          throw new Error('API key not found');
        }
        if (!cancelled) {
          setApiKey(trimmedKey);
        }
        return loadGoogleMapsAPI(trimmedKey);
      })
      .then(() => {
        if (!cancelled) {
          setMapsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Google Maps API load error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const isYakut = language === 'sah';
  const langLabel = isYakut ? 'Тыл: Саха' : 'Язык: Русский';
  const timerLabel = isYakut
    ? (timerEnabled ? 'Таймер: Холбонно' : 'Таймер: Араарылынна')
    : (timerEnabled ? 'Таймер: Вкл' : 'Таймер: Выкл');
  const contactLabel = isYakut ? 'Биһиги кытта ситим' : 'Связаться с нами';

  return (
    <div className="App theme-light">
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
          theme="light"
          timerEnabled={timerEnabled}
          mode={mode}
        />
      )}

      <div className="settings-fab">
        <input id="settings-toggle" type="checkbox" className="settings-toggle-input" />
        <label htmlFor="settings-toggle" className="settings-fab-button">
          ⚙
        </label>
        <div className="settings-panel">
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
            onClick={() => setTimerEnabled((prev) => !prev)}
          >
            {timerLabel}
          </button>
          <a
            href="https://t.me/alpinisti4"
            target="_blank"
            rel="noopener noreferrer"
            className="settings-item settings-link"
          >
            {contactLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
