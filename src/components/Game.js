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
const SEARCH_RADIUS = 2000; // до 10 км вокруг города для поиска панорамы
const CITY_RADIUS_KM = 2; // радиус вокруг города для случайного выбора точки
const MAX_ATTEMPTS_PER_ROUND = 10; // максимум попыток на один раунд
const MAX_GENERATION_ATTEMPTS = TOTAL_ROUNDS * 3; // общее количество попыток генерации
const HELP_RADIUS_KM = 100;

// Список городов и населенных пунктов Якутии с примерными координатами
const YAKUTIA_CITIES = [
  // уже были
  { name: 'Якутск', lat: 62.027575, lng: 129.731505 },
  { name: 'Покровск', lat: 61.661400, lng: 129.393579 },
  { name: 'Мирный', lat: 62.535278, lng: 113.961111 },
  { name: 'Вилюйск', lat: 63.755833, lng: 121.624444 },
  { name: 'Сунтар', lat: 62.157122, lng: 117.650234 },
  { name: 'Нерюнгри', lat: 56.658333, lng: 124.725000 },
  { name: 'Алдан', lat: 58.603333, lng: 125.389444 },
  { name: 'Ленск', lat: 60.725278, lng: 114.927778 },
  { name: 'Олёкминск', lat: 60.374167, lng: 120.420278 },
  { name: 'Среднеколымск', lat: 67.456667, lng: 153.706944 },
  { name: 'Верхоянск', lat: 67.550556, lng: 133.390833 },
  { name: 'Удачный', lat: 66.408333, lng: 112.297222 },
  { name: 'Айхал', lat: 65.950000, lng: 111.500000 },
  { name: 'Чурапча', lat: 62.669658, lng: 131.153541 },
  { name: 'Намцы', lat: 62.716667, lng: 129.666667 },
  { name: 'Амга', lat: 60.900000, lng: 131.983333 },
  { name: 'Бердигестях', lat: 62.100000, lng: 126.700000 },
  { name: 'Майя', lat: 61.733333, lng: 130.283333 },
  { name: 'Хандыга', lat: 62.666667, lng: 135.566667 },
  { name: 'Жиганск', lat: 66.766667, lng: 123.366667 },

  // новые города и посёлки (urban-type)
  { name: 'Нюрба', lat: 63.283333, lng: 118.333333, type: 'urban' },
  { name: 'Томмот', lat: 58.967500, lng: 126.300556, type: 'urban' },
  { name: 'Алмазный', lat: 58.627778, lng: 125.379444, type: 'urban' },
  { name: 'Батагай', lat: 67.653611, lng: 134.597778, type: 'urban' },
  { name: 'Белая Гора', lat: 68.533333, lng: 147.066667, type: 'urban' },
  { name: 'Беркакит', lat: 58.633333, lng: 124.766667, type: 'urban' },
  { name: 'Чернышевский', lat: 62.983333, lng: 135.566667, type: 'urban' },
  { name: 'Черский', lat: 68.750000, lng: 161.300000, type: 'urban' },
  { name: 'Чокурдах', lat: 70.633333, lng: 147.916667, type: 'urban' },
  { name: 'Чульман', lat: 56.866667, lng: 124.883333, type: 'urban' },
  { name: 'Депутатский', lat: 69.300000, lng: 149.883333, type: 'urban' },
  { name: 'Джебарики-Хая', lat: 62.216667, lng: 124.716667, type: 'urban' },
  { name: 'Эльдикан', lat: 60.403333, lng: 135.066667, type: 'urban' },
  { name: 'Эсэ-Хайя', lat: 67.466667, lng: 118.166667, type: 'urban' },
  { name: 'Югорёнок', lat: 60.533333, lng: 135.033333, type: 'urban' },
  { name: 'Кысыл-Сыр', lat: 63.716667, lng: 121.000000, type: 'urban' },
  { name: 'Лебединый', lat: 58.616667, lng: 125.350000, type: 'urban' },
  { name: 'Ленинский', lat: 58.700000, lng: 125.416667, type: 'urban' },
  { name: 'Нижний Бестях', lat: 61.966667, lng: 129.883333, type: 'urban' },
  { name: 'Нижний Куранах', lat: 58.700000, lng: 125.483333, type: 'urban' },
  { name: 'Нижнеянск', lat: 70.766667, lng: 149.916667, type: 'urban' },
  { name: 'Пеледуй', lat: 60.350000, lng: 115.166667, type: 'urban' },
  { name: 'Пригородный', lat: 62.000000, lng: 129.666667, type: 'village' },
  { name: 'Сангар', lat: 62.083333, lng: 117.966667, type: 'urban' },
  { name: 'Серебряный Бор', lat: 56.866667, lng: 124.750000, type: 'urban' },
  { name: 'Солнечный', lat: 60.366667, lng: 120.883333, type: 'urban' },
  { name: 'Светлый', lat: 60.933333, lng: 114.916667, type: 'urban' },
  { name: 'Тикси', lat: 71.633333, lng: 128.866667, type: 'urban' },
  { name: 'Торго', lat: 60.216667, lng: 119.766667, type: 'urban' },
  { name: 'Усть-Куйга', lat: 70.000000, lng: 135.550000, type: 'urban' },
  { name: 'Усть-Мая', lat: 60.400000, lng: 134.533333, type: 'urban' },
  { name: 'Усть-Нера', lat: 64.566667, lng: 143.216667, type: 'urban' },
  { name: 'Витим', lat: 59.450000, lng: 112.583333, type: 'urban' },
  { name: 'Жатай', lat: 62.200000, lng: 129.800000, type: 'urban' },
  { name: 'Золотинка', lat: 63.700000, lng: 122.466667, type: 'urban' },
  { name: 'Звёздочка', lat: 62.200000, lng: 114.633333, type: 'urban' },
  { name: 'Зырянка', lat: 65.750000, lng: 150.866667, type: 'urban' },

  // крупные/упоминаемые сёла и деревни
  { name: 'Хатассы', lat: 62.033333, lng: 129.716667, type: 'village' },
  { name: 'Чурапча', lat: 62.669658, lng: 131.153541, type: 'village' },
  { name: 'Намцы', lat: 62.716667, lng: 129.666667, type: 'village' },
  { name: 'Майя', lat: 61.733333, lng: 130.283333, type: 'village' },
  { name: 'Сунтар', lat: 62.157122, lng: 117.650234, type: 'village' },
  { name: 'Амга', lat: 60.900000, lng: 131.983333, type: 'village' },
  { name: 'Бердигестях', lat: 62.100000, lng: 126.700000, type: 'village' },
  { name: 'Хандыга', lat: 62.666667, lng: 135.566667, type: 'village' },
  { name: 'Жиганск', lat: 66.766667, lng: 123.366667, type: 'village' },
  { name: 'Аллах-Юнь', lat: 56.216667, lng: 125.266667, type: 'village' },
  { name: 'Артык', lat: 58.816667, lng: 125.766667, type: 'village' },
  { name: 'Хани', lat: 62.466667, lng: 124.683333, type: 'village' }
];

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

  // Проверяем, что панорама находится в одном из известных городов
  const isPanoramaInKnownCity = (panorama) => {
    if (!panorama || !panorama.location) return false;
    const desc = (panorama.location.description || '').toLowerCase();
    const shortDesc = (panorama.location.shortDescription || '').toLowerCase();
    const text = `${desc} ${shortDesc}`;

    // Проверяем наличие названий городов в описании
    return YAKUTIA_CITIES.some(city => {
      const cityNameLower = city.name.toLowerCase();
      return text.includes(cityNameLower);
    });
  };

  // Генерируем случайную точку в радиусе вокруг города
  const getRandomPointAroundCity = (city, radiusKm) => {
    // Генерируем случайное расстояние (0 до radiusKm) и угол
    const distanceKm = Math.random() * radiusKm;
    const angle = Math.random() * Math.PI * 2;
    
    // Преобразуем расстояние в градусы (примерно 111 км на градус)
    const dLat = (distanceKm * Math.cos(angle)) / 111;
    const dLng = (distanceKm * Math.sin(angle)) / (111 * Math.cos(city.lat * Math.PI / 180));
    
    return {
      lat: city.lat + dLat,
      lng: city.lng + dLng,
    };
  };

  // Ищем панораму в случайном городе из списка
  const findPanoramaInYakutia = async () => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_ROUND; attempt++) {
      // Случайно выбираем город
      const randomCity = YAKUTIA_CITIES[Math.floor(Math.random() * YAKUTIA_CITIES.length)];
      
      // Генерируем случайную точку в радиусе 10 км вокруг города
      const searchPoint = getRandomPointAroundCity(randomCity, CITY_RADIUS_KM);
      
      // Ищем панораму в этой точке
      const panorama = await getPanoramaAtPoint(searchPoint);
      
      // Проверяем, что панорама находится в одном из известных городов
      if (panorama && isPanoramaInKnownCity(panorama)) {
        return panorama;
      }
    }
    return null;
  };

  const mapPanoramaToLocation = (panorama, index) => {
    const latLng = panorama.location.latLng;
    const desc = (panorama.location.description || '').toLowerCase();
    const shortDesc = (panorama.location.shortDescription || '').toLowerCase();
    const text = `${desc} ${shortDesc}`;
    
    // Находим название города из описания
    let cityName = 'Якутия';
    for (const city of YAKUTIA_CITIES) {
      if (text.includes(city.name.toLowerCase())) {
        cityName = city.name;
        break;
      }
    }
    
    return {
      id: panorama.location.pano || index,
      lat: latLng.lat(),
      lng: latLng.lng(),
      city: cityName,
      place: panorama.location.shortDescription || panorama.location.description?.split(',')[0]?.trim() || 'Панорама',
      hint: 'Республика Саха (Якутия)',
    };
  };

  const initRounds = async () => {
    setLoadingRounds(true);
    setRoundsError('');

    const generated = [];
    const usedPanoIds = new Set(); // Для предотвращения дубликатов
    let attempts = 0;

    while (generated.length < TOTAL_ROUNDS && attempts < MAX_GENERATION_ATTEMPTS) {
      const panorama = await findPanoramaInYakutia();
      attempts += 1;
      if (!panorama) {
        continue;
      }
      
      // Проверяем, не использовали ли мы уже эту панораму
      const panoId = panorama.location.pano;
      if (panoId && usedPanoIds.has(panoId)) {
        continue;
      }
      
      if (panoId) {
        usedPanoIds.add(panoId);
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

