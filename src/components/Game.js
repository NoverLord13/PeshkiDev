import React, { useState, useEffect, useRef } from 'react';
import './Game.css';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultModal from './ResultModal';
import FinalResults from './FinalResults';

const TOTAL_ROUNDS = 5;

const SEARCH_RADIUS = 17000; // до 10 км вокруг города для поиска панорамы
const CITY_RADIUS_KM = 17; // радиус вокруг города для случайного выбора точки
const HELP_RADIUS_KM = 100;
const ROUND_TIME_SECONDS = 120; // 2 минуты на раунд
const PANORAMA_HISTORY_KEY = 'yktguessr.panoHistory';
const PANORAMA_HISTORY_LIMIT = 240;
const CITY_HISTORY_KEY = 'yktguessr.cityHistory';
const CITY_HISTORY_LIMIT = 80;

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

function Game({ onReset, language = 'ru', theme = 'light', timerEnabled = true, mode = 'all' }) {
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
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [isMapVisible, setIsMapVisible] = useState(true);
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

  const getPanoramaAtPoint = (point, radius = SEARCH_RADIUS) => new Promise((resolve) => {
    if (!streetViewServiceRef.current) return resolve(null);
    streetViewServiceRef.current.getPanorama(
      {
        location: point,
        radius,
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

  const toRad = (value) => value * Math.PI / 180;
  const distanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const getModeCities = () => (
    mode === 'yakutsk'
      ? YAKUTIA_CITIES.filter((city) => city.name === '\u042f\u043a\u0443\u0442\u0441\u043a')
      : YAKUTIA_CITIES
  );

  const createProbePoints = (city) => {
    const radii = [0, 2.5, 5, 8.5, 12, 16];
    const angleOffset = Math.random() * Math.PI * 2;
    return radii.map((radius, index) => {
      if (radius === 0) {
        return { lat: city.lat, lng: city.lng };
      }
      const angle = angleOffset + ((Math.PI * 2) / (radii.length - 1)) * (index - 1);
      const dLat = (radius * Math.cos(angle)) / 111;
      const dLng = (radius * Math.sin(angle)) / (111 * Math.cos(toRad(city.lat)));
      return { lat: city.lat + dLat, lng: city.lng + dLng };
    });
  };

  const normalizePanoramaCandidate = (panorama, city) => {
    if (!panorama?.location?.latLng) return null;

    const panoId = panorama.location.pano;
    if (!panoId) return null;

    const lat = panorama.location.latLng.lat();
    const lng = panorama.location.latLng.lng();
    const distToCity = distanceKm(lat, lng, city.lat, city.lng);
    const maxAllowedDistance = Math.max(CITY_RADIUS_KM + 8, 22);
    if (distToCity > maxAllowedDistance) return null;

    return {
      panoId,
      lat,
      lng,
      city: city.name,
      place: panorama.location.shortDescription
        || panorama.location.description?.split(',')[0]?.trim()
        || '\u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430',
      cityDistanceKm: distToCity,
    };
  };

  const getPanoramaHistoryKey = () => `${PANORAMA_HISTORY_KEY}:${mode}`;
  const getCityHistoryKey = () => `${CITY_HISTORY_KEY}:${mode}`;

  const readHistory = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const writeHistory = (key, values, limit) => {
    const prev = readHistory(key);
    const all = [...prev, ...values.filter(Boolean)];
    const seen = new Set();
    const dedupedReversed = [];

    for (let i = all.length - 1; i >= 0; i--) {
      const value = all[i];
      if (seen.has(value)) continue;
      seen.add(value);
      dedupedReversed.push(value);
    }

    const deduped = dedupedReversed.reverse();
    const limitedValues = deduped.slice(-limit);

    try {
      localStorage.setItem(key, JSON.stringify(limitedValues));
    } catch {
      // ignore storage errors
    }
  };

  const readPanoHistory = () => readHistory(getPanoramaHistoryKey());
  const readCityHistory = () => readHistory(getCityHistoryKey());
  const writePanoHistory = (panoIds) => writeHistory(getPanoramaHistoryKey(), panoIds, PANORAMA_HISTORY_LIMIT);
  const writeCityHistory = (cityNames) => writeHistory(getCityHistoryKey(), cityNames, CITY_HISTORY_LIMIT);

  const discoverCandidates = async ({
    blockedPanoIds = new Set(),
    blockedCityNames = new Set(),
    allowBlockedCities = false,
    requestBudget = 120,
  } = {}) => {
    const modeCities = getModeCities();
    const cityPool = modeCities.length > 0 ? modeCities : YAKUTIA_CITIES;
    const preferredCities = allowBlockedCities
      ? cityPool
      : cityPool.filter((city) => !blockedCityNames.has(city.name));
    const fallbackCities = cityPool.filter((city) => blockedCityNames.has(city.name));
    const cityQueue = shuffle([
      ...preferredCities,
      ...(allowBlockedCities ? [] : shuffle(fallbackCities)),
    ]);

    const byPanoId = new Map();
    let requests = 0;
    const targetCandidates = TOTAL_ROUNDS * 10;

    for (const city of cityQueue) {
      if (requests >= requestBudget || byPanoId.size >= targetCandidates) break;
      const probePoints = createProbePoints(city);

      for (const point of probePoints) {
        if (requests >= requestBudget || byPanoId.size >= targetCandidates) break;
        requests += 1;

        const panorama = await getPanoramaAtPoint(point);
        const candidate = normalizePanoramaCandidate(panorama, city);
        if (!candidate) continue;
        if (blockedPanoIds.has(candidate.panoId)) continue;
        if (byPanoId.has(candidate.panoId)) continue;

        byPanoId.set(candidate.panoId, candidate);
      }
    }

    return [...byPanoId.values()];
  };

  const selectRoundsFromCandidates = (candidates, historyCityNames) => {
    const minDistanceBetweenRoundsKm = mode === 'yakutsk' ? 1.5 : 14;
    const selected = [];
    const usedPano = new Set();
    const usedCity = new Set();

    const scoreCandidate = (candidate) => {
      let score = 0;
      score += historyCityNames.has(candidate.city) ? -90 : 80;
      score += Math.max(0, 14 - candidate.cityDistanceKm) * 2;
      score += Math.random() * 25;
      return score;
    };

    const ranked = [...candidates].sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

    const isTooClose = (candidate) => selected.some(
      (existing) => distanceKm(existing.lat, existing.lng, candidate.lat, candidate.lng) < minDistanceBetweenRoundsKm
    );

    for (const candidate of ranked) {
      if (selected.length >= TOTAL_ROUNDS) break;
      if (usedPano.has(candidate.panoId)) continue;
      if (usedCity.has(candidate.city)) continue;
      if (isTooClose(candidate)) continue;

      selected.push(candidate);
      usedPano.add(candidate.panoId);
      usedCity.add(candidate.city);
    }

    for (const candidate of ranked) {
      if (selected.length >= TOTAL_ROUNDS) break;
      if (usedPano.has(candidate.panoId)) continue;
      if (isTooClose(candidate)) continue;

      selected.push(candidate);
      usedPano.add(candidate.panoId);
      usedCity.add(candidate.city);
    }

    for (const candidate of ranked) {
      if (selected.length >= TOTAL_ROUNDS) break;
      if (usedPano.has(candidate.panoId)) continue;

      selected.push(candidate);
      usedPano.add(candidate.panoId);
      usedCity.add(candidate.city);
    }

    return selected.slice(0, TOTAL_ROUNDS);
  };

  const initRounds = async () => {
    setLoadingRounds(true);
    setRoundsError('');

    const historyPanoIds = new Set(readPanoHistory());
    const historyCityNames = new Set(readCityHistory());

    const phaseOneCandidates = await discoverCandidates({
      blockedPanoIds: historyPanoIds,
      blockedCityNames: historyCityNames,
      allowBlockedCities: false,
      requestBudget: mode === 'yakutsk' ? 90 : 140,
    });

    let selectedCandidates = selectRoundsFromCandidates(phaseOneCandidates, historyCityNames);

    if (selectedCandidates.length < TOTAL_ROUNDS) {
      const selectedPanoIds = new Set(selectedCandidates.map((candidate) => candidate.panoId));
      const phaseTwoCandidates = await discoverCandidates({
        blockedPanoIds: new Set([...historyPanoIds, ...selectedPanoIds]),
        blockedCityNames: historyCityNames,
        allowBlockedCities: true,
        requestBudget: mode === 'yakutsk' ? 70 : 120,
      });

      selectedCandidates = selectRoundsFromCandidates(
        [...selectedCandidates, ...phaseTwoCandidates],
        historyCityNames
      );
    }

    if (selectedCandidates.length > 0) {
      const generated = selectedCandidates.slice(0, TOTAL_ROUNDS).map((candidate, index) => ({
        id: candidate.panoId || index,
        lat: candidate.lat,
        lng: candidate.lng,
        city: candidate.city,
        place: candidate.place,
        hint: '\u0420\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430 \u0421\u0430\u0445\u0430 (\u042f\u043a\u0443\u0442\u0438\u044f)',
      }));

      writePanoHistory(generated.map((item) => item.id));
      writeCityHistory(generated.map((item) => item.city));

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
      setRoundsError('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043d\u0430\u0439\u0442\u0438 \u043f\u0430\u043d\u043e\u0440\u0430\u043c\u044b \u0432 \u042f\u043a\u0443\u0442\u0438\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.');
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

  const calculateDistance = (lat1, lng1, lat2, lng2) => distanceKm(lat1, lng1, lat2, lng2);

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

  const handleTimeUp = () => {
    if (!currentLocation || showResult) return;

    // Время вышло — 0 баллов, показываем локацию
    const lat = currentLocation.lat;
    const lng = currentLocation.lng;

    setGuessedLocation({ lat, lng });
    const dist = 0;
    const finalScore = 0;

    setDistance(dist);
    setRoundScore(finalScore);
    setTotalScore(prev => prev + finalScore);

    setRoundResults(prev => [...prev, {
      round: currentRound,
      distance: dist,
      score: finalScore,
      actual: { lat: currentLocation.lat, lng: currentLocation.lng },
      guessed: { lat, lng },
      location: currentLocation,
      timedOut: true,
    }]);

    setShowResult(true);
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

  // Сбрасываем таймер при переходе на новый раунд / новую локацию
  useEffect(() => {
    if (!currentLocation || gameFinished) return;
    setTimeLeft(ROUND_TIME_SECONDS);
  }, [currentRound, currentLocation, gameFinished]);

  // Запускаем обратный отсчёт (если таймер включён)
  useEffect(() => {
    if (!timerEnabled) return;
    if (showResult || gameFinished || !currentLocation) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerEnabled, showResult, gameFinished, currentLocation]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        <div className="loading-spinner" aria-hidden="true"></div>
        <div className="loading-text">
          {isYakut ? 'Загрузка...' : 'Загрузка...'}
        </div>
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
    <div className={`game ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <div className="game-header">
        <div className="round-info">
          {currentRound} / {totalRounds}
        </div>
        <div className="score-info">
          {totalScore.toLocaleString()}
        </div>
        {timerEnabled && (
          <div className={`timer-info ${timeLeft <= 30 ? 'low' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <StreetView
        location={currentLocation}
      />

      <GuessMap 
        onGuess={handleGuess}
        disabled={showResult || (timerEnabled && timeLeft <= 0)}
        actualLocation={currentLocation}
        guessedLocation={guessedLocation}
        helpActive={helpActive}
        onHelp={() => {
          setHelpActive(true);
          if (!helpCenter && currentLocation) {
            setHelpCenter(getHelpCenter(currentLocation));
          }
          playSound('help');
        }}
        helpRadiusKm={HELP_RADIUS_KM}
        helpCenter={helpCenter}
        language={language}
        mode={mode}
        onVisibilityChange={setIsMapVisible}
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
