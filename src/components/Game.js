import React, { useState, useEffect } from 'react';
import './Game.css';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultModal from './ResultModal';
import FinalResults from './FinalResults';

const TOTAL_ROUNDS = 5;

function Game({ apiKey, places, onReset, mode = 'classic' }) {
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
  const [hintsUsed, setHintsUsed] = useState([]);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [cityCenters, setCityCenters] = useState({});
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  // Инициализация раундов
  useEffect(() => {
    const validPlaces = places.filter(p => p.lat && p.lng);
    const shuffled = [...validPlaces].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, TOTAL_ROUNDS);
    setRoundLocations(selected);
    setCurrentLocation(selected[0]);

    // Центры городов для упрощенного режима
    const cityMap = {};
    validPlaces.forEach((p) => {
      if (!p.city) return;
      if (!cityMap[p.city]) {
        cityMap[p.city] = { lat: p.lat, lng: p.lng, count: 1 };
      } else {
        cityMap[p.city].lat += p.lat;
        cityMap[p.city].lng += p.lng;
        cityMap[p.city].count += 1;
      }
    });
    Object.keys(cityMap).forEach((city) => {
      cityMap[city].lat /= cityMap[city].count;
      cityMap[city].lng /= cityMap[city].count;
    });
    setCityCenters(cityMap);
    setAvailableCities(Object.keys(cityMap).sort());
  }, [places]);

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

  const handleHint = (hintLevel) => {
    if (hintsUsed.includes(hintLevel)) return;
    
    const penalty = hintLevel === 1 ? 1000 : 1500;
    setHintPenalty(prev => prev + penalty);
    setHintsUsed(prev => [...prev, hintLevel]);
  };

  const handleGuess = (lat, lng) => {
    if (!currentLocation) return;
    
    setGuessedLocation({ lat, lng });
    const dist = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      lat,
      lng
    );
    const baseScore = calculateScore(dist);
    const finalScore = Math.max(0, baseScore - hintPenalty);
    
    setDistance(dist);
    setRoundScore(finalScore);
    setTotalScore(prev => prev + finalScore);
    
    // Сохраняем результаты раунда
    setRoundResults(prev => [...prev, {
      round: currentRound,
      distance: dist,
      score: finalScore,
      baseScore: baseScore,
      hintPenalty: hintPenalty,
      actual: { lat: currentLocation.lat, lng: currentLocation.lng },
      guessed: { lat, lng },
      location: currentLocation
    }]);
    
    setShowResult(true);
  };

  const handleCityGuess = () => {
    if (!currentLocation || !selectedCity || !cityCenters[selectedCity]) return;
    const center = cityCenters[selectedCity];
    handleGuess(center.lat, center.lng);
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      setGameFinished(true);
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentLocation(roundLocations[currentRound]);
      setGuessedLocation(null);
      setShowResult(false);
      setRoundScore(0);
      setDistance(0);
      setHintsUsed([]);
      setHintPenalty(0);
      setSelectedCity('');
    }
  };

  if (gameFinished) {
    return (
      <FinalResults 
        totalScore={totalScore}
        roundResults={roundResults}
        onPlayAgain={onReset}
      />
    );
  }

  if (!currentLocation) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="game">
      <div className="game-header">
        <div className="round-info">
          Раунд {currentRound} / {TOTAL_ROUNDS}
        </div>
        <div className="score-info">
          Очки: {totalScore.toLocaleString()}
        </div>
      </div>

      {!showResult && (
        <div className="hints-panel">
          <button 
            className={`hint-button ${hintsUsed.includes(1) ? 'used' : ''}`}
            onClick={() => handleHint(1)}
            disabled={hintsUsed.includes(1)}
          >
            {hintsUsed.includes(1) ? `🏙️ ${currentLocation.city}` : '💡 Город (-1000)'}
          </button>
          <button 
            className={`hint-button ${hintsUsed.includes(2) ? 'used' : ''}`}
            onClick={() => handleHint(2)}
            disabled={hintsUsed.includes(2)}
          >
            {hintsUsed.includes(2) ? `📍 ${currentLocation.place}` : '💡 Место (-1500)'}
          </button>
          {hintsUsed.includes(1) && (
            <div className="hint-text">
              {currentLocation.hint}
            </div>
          )}
        </div>
      )}

      <StreetView 
        location={currentLocation}
      />

      {mode === 'classic' && (
        <GuessMap 
          onGuess={handleGuess}
          disabled={showResult}
          actualLocation={showResult ? currentLocation : null}
          guessedLocation={guessedLocation}
        />
      )}

      {mode === 'simple' && !showResult && (
        <div className="simple-guess-panel">
          <div className="simple-guess-label">Выбери населённый пункт</div>
          <select
            className="simple-guess-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">— Город или село —</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <button
            className="simple-guess-button"
            onClick={handleCityGuess}
            disabled={!selectedCity}
          >
            Угадать
          </button>
        </div>
      )}

      {showResult && (
        <ResultModal
          distance={distance}
          score={roundScore}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
          onNext={nextRound}
          location={currentLocation}
        />
      )}
    </div>
  );
}

export default Game;

