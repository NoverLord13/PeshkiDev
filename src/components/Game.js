import React, { useState, useEffect, useRef } from 'react';
import './Game.css';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultModal from './ResultModal';
import FinalResults from './FinalResults';

const TOTAL_ROUNDS = 5;
const REGION_BOUNDS = {
  // Примерные границы Республики Саха (Якутия)
  north: 76,
  south: 55,
  west: 105,
  east: 151,
};
const SEARCH_RADIUS = 30000; // до 30 км вокруг случайной точки
const MAX_ATTEMPTS_PER_ROUND = 30;
const MAX_GENERATION_ATTEMPTS = TOTAL_ROUNDS * 5;
const HELP_RADIUS_KM = 100;

function Game({ onReset, language = 'ru' }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [roundLocations, setRoundLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [guessedLocation, setGuessedLocation] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [roundsError, setRoundsError] = useState('');
  const [helpActive, setHelpActive] = useState(false);
  const [helpCenter, setHelpCenter] = useState(null);
  const streetViewServiceRef = useRef(null);

  const totalRounds = roundLocations.length || TOTAL_ROUNDS;

  // Заглушка для звуков — подключите реальный проигрыватель позже
  const playSound = (type) => {
    // TODO: добавить воспроизведение звуков по типу (help, guess, next, finish)
  };

  // Инициализация раундов
  useEffect(() => {
    if (window.google && window.google.maps) {
      streetViewServiceRef.current = new window.google.maps.StreetViewService();
      initRounds();
    }
  }, []);

  const getRandomPointInYakutia = () => ({
    lat: REGION_BOUNDS.south + Math.random() * (REGION_BOUNDS.north - REGION_BOUNDS.south),
    lng: REGION_BOUNDS.west + Math.random() * (REGION_BOUNDS.east - REGION_BOUNDS.west),
  });

  const getPanoramaAtPoint = (point) => new Promise((resolve) => {
    if (!streetViewServiceRef.current) return resolve(null);
    streetViewServiceRef.current.getPanorama(
      {
        location: point,
        radius: SEARCH_RADIUS,
        preference: window.google.maps.StreetViewPreference.NEAREST,
        source: window.google.maps.StreetViewSource.OUTDOOR,
      },
      (data, status) => {
        if (status === window.google.maps.StreetViewStatus.OK) {
          resolve(data);
        } else {
          resolve(null);
        }
      }
    );
  });

  const isPanoramaInYakutia = (panorama) => {
    if (!panorama || !panorama.location) return false;
    const desc = (panorama.location.description || '').toLowerCase();
    const shortDesc = (panorama.location.shortDescription || '').toLowerCase();
    const text = `${desc} ${shortDesc}`;

    const keywords = [
      'якутия',
      'республика саха',
      'sakha republic',
      'yakutia',
      'yakutsk',
      'якутск',
      'саха сирэ',
    ];

    return keywords.some((k) => text.includes(k));
  };

  const findPanoramaInYakutia = async () => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_ROUND; attempt++) {
      const randomPoint = getRandomPointInYakutia();
      const panorama = await getPanoramaAtPoint(randomPoint);
      if (panorama && isPanoramaInYakutia(panorama)) return panorama;
    }
    return null;
  };

  const mapPanoramaToLocation = (panorama, index) => {
    const latLng = panorama.location.latLng;
    return {
      id: panorama.location.pano || index,
      lat: latLng.lat(),
      lng: latLng.lng(),
      city: panorama.location.description?.split(',')[0]?.trim() || 'Якутия',
      place: panorama.location.shortDescription || 'Панорама',
      hint: 'Республика Саха (Якутия)',
    };
  };

  const initRounds = async () => {
    setLoadingRounds(true);
    setRoundsError('');

    const generated = [];
    let attempts = 0;

    while (generated.length < TOTAL_ROUNDS && attempts < MAX_GENERATION_ATTEMPTS) {
      const panorama = await findPanoramaInYakutia();
      attempts += 1;
      if (!panorama) {
        continue;
      }
      generated.push(mapPanoramaToLocation(panorama, generated.length));
    }

    if (generated.length > 0) {
      setRoundLocations(generated);
      setCurrentLocation(generated[0]);
      setCurrentRound(1);
      setGuessedLocation(null);
      setShowResult(false);
      setRoundScore(0);
      setTotalScore(0);
      setRoundResults([]);
      setDistance(0);
      setGameFinished(false);
      setHelpActive(false);
      setHelpCenter(generated[0] ? getHelpCenter(generated[0]) : null);
    } else {
      setRoundsError('Не удалось найти панорамы в Якутии. Попробуйте еще раз.');
    }

    setLoadingRounds(false);
  };

  const getHelpCenter = (location) => {
    if (!location) return null;
    // Смещаем центр круга, чтобы точка не совпадала с искомой
    const maxOffsetKm = HELP_RADIUS_KM * 0.6; // до 60% радиуса
    const r = Math.random() * maxOffsetKm;
    const angle = Math.random() * Math.PI * 2;
    const dLat = (r * Math.cos(angle)) / 111; // км -> градусы широты
    const dLng = (r * Math.sin(angle)) / (111 * Math.cos(location.lat * Math.PI / 180 || 1));
    return {
      lat: location.lat + dLat,
      lng: location.lng + dLng,
    };
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateScore = (distanceKm) => {
    // Система очков как в GeoGuessr
    if (distanceKm < 1) return 5000;
    if (distanceKm < 10) return Math.round(5000 - (distanceKm * 400));
    if (distanceKm < 50) return Math.round(4000 - (distanceKm * 60));
    if (distanceKm < 100) return Math.round(3000 - (distanceKm * 25));
    if (distanceKm < 500) return Math.round(2000 - (distanceKm * 3));
    if (distanceKm < 1000) return Math.round(500 - (distanceKm * 0.5));
    return 0;
  };

  const handleGuess = (lat, lng) => {
    if (!currentLocation) return;
    playSound('guess');
    
    setGuessedLocation({ lat, lng });
    const dist = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      lat,
      lng
    );
    const finalScore = calculateScore(dist);
    
    setDistance(dist);
    setRoundScore(finalScore);
    setTotalScore(prev => prev + finalScore);
    
    // Сохраняем результаты раунда
    setRoundResults(prev => [...prev, {
      round: currentRound,
      distance: dist,
      score: finalScore,
      actual: { lat: currentLocation.lat, lng: currentLocation.lng },
      guessed: { lat, lng },
      location: currentLocation
    }]);
    
    setShowResult(true);
  };

  const nextRound = () => {
    if (currentRound >= totalRounds) {
      setGameFinished(true);
      playSound('finish');
    } else {
      const nextLocation = roundLocations[currentRound];
      if (!nextLocation) {
        setGameFinished(true);
        return;
      }
      setCurrentRound(prev => prev + 1);
      setCurrentLocation(nextLocation);
      setGuessedLocation(null);
      setShowResult(false);
      setRoundScore(0);
      setDistance(0);
      setHelpActive(false);
      setHelpCenter(getHelpCenter(nextLocation));
      playSound('next');
    }
  };

  const isYakut = language === 'sah';

  if (loadingRounds) {
    return (
      <div className="loading">
        {isYakut ? 'Саха Сирин панорамаларын көстүүбүт...' : 'Ищем случайные панорамы Якутии...'}
      </div>
    );
  }

  if (roundsError) {
    return (
      <div className="loading">
        {roundsError}
        <div style={{ marginTop: '12px' }}>
          <button className="next-button" onClick={initRounds}>
            {isYakut ? 'Хатылаа' : 'Попробовать снова'}
          </button>
          <button
            className="next-button"
            onClick={onReset}
            style={{ marginLeft: '8px' }}
          >
            {isYakut ? 'Төнүн' : 'Назад'}
          </button>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <FinalResults 
        totalScore={totalScore}
        roundResults={roundResults}
        onPlayAgain={onReset}
        language={language}
      />
    );
  }

  if (!currentLocation) {
    return (
      <div className="loading">
        {isYakut ? 'Туруорууммыт...' : 'Загрузка...'}
      </div>
    );
  }

  return (
    <div className="game">
      <div className="game-header">
        <div className="round-info">
          {isYakut ? 'Раунд' : 'Раунд'} {currentRound} / {totalRounds}
        </div>
        <div className="score-info">
          {isYakut ? 'Балл: ' : 'Очки: '}{totalScore.toLocaleString()}
        </div>
      </div>

      {!showResult && (
        <div className="hints-panel">
          <button
            className={`hint-button ${helpActive ? 'used' : ''}`}
            onClick={() => {
              setHelpActive(true);
              if (!helpCenter && currentLocation) {
                setHelpCenter(getHelpCenter(currentLocation));
              }
              playSound('help');
            }}
            disabled={helpActive}
          >
            {helpActive
              ? (isYakut ? 'Көмө түбэһин көрдөрүллүбэтэ' : 'Радиус подсказки включен')
              : (isYakut ? 'Көмө түбэһинэн' : 'Помощь (радиус)')}
          </button>
        </div>
      )}

      <StreetView
        location={currentLocation}
      />

      <GuessMap 
        onGuess={handleGuess}
        disabled={showResult}
        actualLocation={currentLocation}
        guessedLocation={guessedLocation}
        helpActive={helpActive}
        helpRadiusKm={HELP_RADIUS_KM}
        helpCenter={helpCenter}
        language={language}
      />

      {showResult && (
        <ResultModal
          distance={distance}
          score={roundScore}
          currentRound={currentRound}
          totalRounds={totalRounds}
          onNext={nextRound}
          location={currentLocation}
          guessedLocation={guessedLocation}
          language={language}
        />
      )}
    </div>
  );
}

export default Game;

