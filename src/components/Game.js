import React, { useState, useEffect, useRef } from 'react';
import './Game.css';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ResultModal from './ResultModal';
import FinalResults from './FinalResults';

const TOTAL_ROUNDS = 5;

const SEARCH_RADIUS_YAKUTSK = 17000; // базовый радиус поиска панорамы для Якутска
const SEARCH_RADIUS_ALL = 6000; // уменьшенный радиус для режима "Вся Якутия"
const CITY_RADIUS_KM_YAKUTSK = 17; // базовый радиус вокруг города для Якутска
const CITY_RADIUS_KM_ALL = 6; // уменьшенный радиус для режима "Вся Якутия"
const HELP_RADIUS_KM_ALL = 100;
const HELP_RADIUS_KM_YAKUTSK = 3;
const ROUND_TIME_SECONDS = 120; // 2 минуты на раунд
const PANORAMA_HISTORY_KEY = 'yktguessr.panoHistory';
const PANORAMA_HISTORY_LIMIT = 240;
const CITY_HISTORY_KEY = 'yktguessr.cityHistory';
const CITY_HISTORY_LIMIT = 80;

// Список городов и населенных пунктов Якутии с примерными координатами
const YAKUTIA_CITIES = [
  // Города (city)
  { name: 'Якутск', lat: 62.0272, lng: 129.7321, type: 'city' },
  { name: 'Мирный', lat: 62.5353, lng: 113.9611, type: 'city' },
  { name: 'Нерюнгри', lat: 56.6583, lng: 124.7250, type: 'city' },
  { name: 'Алдан', lat: 58.6033, lng: 125.3894, type: 'city' },
  { name: 'Ленск', lat: 60.7253, lng: 114.9278, type: 'city' },
  { name: 'Вилюйск', lat: 63.7558, lng: 121.6244, type: 'city' },
  { name: 'Олёкминск', lat: 60.3742, lng: 120.4203, type: 'city' },
  { name: 'Покровск', lat: 61.4772, lng: 129.1414, type: 'city' },
  { name: 'Нюрба', lat: 63.2833, lng: 118.3333, type: 'city' },
  { name: 'Томмот', lat: 58.9675, lng: 126.3006, type: 'city' },
  { name: 'Удачный', lat: 66.4083, lng: 112.2972, type: 'city' },
  { name: 'Среднеколымск', lat: 67.4567, lng: 153.7069, type: 'city' },
  { name: 'Верхоянск', lat: 67.5506, lng: 133.3908, type: 'city' },

  // Посёлки городского типа (urban)
  { name: 'Айхал', lat: 65.9500, lng: 111.5000, type: 'urban' },
  { name: 'Жатай', lat: 62.1303, lng: 129.8331, type: 'urban' },
  { name: 'Нижний Бестях', lat: 61.9575, lng: 129.9108, type: 'urban' },
  { name: 'Тикси', lat: 71.6333, lng: 128.8667, type: 'urban' },
  { name: 'Усть-Нера', lat: 64.5667, lng: 143.2167, type: 'urban' },
  { name: 'Хандыга', lat: 62.6547, lng: 135.5606, type: 'urban' },
  { name: 'Нижний Куранах', lat: 58.8353, lng: 125.5028, type: 'urban' },
  { name: 'Светлый', lat: 63.0589, lng: 113.4131, type: 'urban' },
  { name: 'Чернышевский', lat: 63.0122, lng: 112.4658, type: 'urban' },
  { name: 'Чульман', lat: 56.8456, lng: 124.9078, type: 'urban' },
  { name: 'Депутатский', lat: 69.3117, lng: 149.9039, type: 'urban' },
  { name: 'Батагай', lat: 67.6536, lng: 134.5978, type: 'urban' },
  { name: 'Сангар', lat: 63.9231, lng: 127.4722, type: 'urban' },
  { name: 'Черский', lat: 68.7500, lng: 161.3000, type: 'urban' },
  { name: 'Серебряный Бор', lat: 56.6542, lng: 124.8117, type: 'urban' },
  { name: 'Беркакит', lat: 56.5819, lng: 124.7864, type: 'urban' },
  { name: 'Белая Гора', lat: 68.5333, lng: 147.0667, type: 'urban' },
  { name: 'Чокурдах', lat: 70.6333, lng: 147.9167, type: 'urban' },
  { name: 'Кысыл-Сыр', lat: 63.8919, lng: 122.7631, type: 'urban' },
  { name: 'Витим', lat: 59.4500, lng: 112.5833, type: 'urban' },
  { name: 'Пеледуй', lat: 59.6267, lng: 112.7503, type: 'urban' },
  { name: 'Усть-Мая', lat: 60.4167, lng: 134.4500, type: 'urban' },
  { name: 'Джебарики-Хая', lat: 62.2042, lng: 135.8039, type: 'urban' },
  { name: 'Зырянка', lat: 65.7333, lng: 150.8917, type: 'urban' },
  { name: 'Усть-Куйга', lat: 70.0000, lng: 135.5500, type: 'urban' },
  { name: 'Алмазный', lat: 62.4542, lng: 114.3167, type: 'urban' },
  { name: 'Солнечный', lat: 58.5600, lng: 125.4167, type: 'urban' },
  { name: 'Ленинский', lat: 58.5732, lng: 125.4374, type: 'urban' },
  { name: 'Золотинка', lat: 56.1242, lng: 124.5833, type: 'urban' },

  // Села и крупные наслеги (village)
  { name: 'Чурапча', lat: 62.0000, lng: 132.4333, type: 'village' },
  { name: 'Намцы', lat: 62.7167, lng: 129.6667, type: 'village' },
  { name: 'Майя', lat: 61.7333, lng: 130.2833, type: 'village' },
  { name: 'Амга', lat: 60.9000, lng: 131.9833, type: 'village' },
  { name: 'Бердигестях', lat: 62.1000, lng: 126.7000, type: 'village' },
  { name: 'Сунтар', lat: 62.1571, lng: 117.6502, type: 'village' },
  { name: 'Жиганск', lat: 66.7667, lng: 123.3667, type: 'village' },
  { name: 'Хатассы', lat: 61.9056, lng: 129.6389, type: 'village' },
  { name: 'Аллах-Юнь', lat: 61.1256, lng: 137.9833, type: 'village' },
  { name: 'Артык', lat: 64.1833, lng: 145.1333, type: 'village' },
  { name: 'Хани', lat: 56.3403, lng: 117.4111, type: 'village' }
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

  const getSearchRadiusMeters = () => (mode === 'yakutsk' ? SEARCH_RADIUS_YAKUTSK : SEARCH_RADIUS_ALL);
  const getCityRadiusKm = () => (mode === 'yakutsk' ? CITY_RADIUS_KM_YAKUTSK : CITY_RADIUS_KM_ALL);
  const getProbeRadiiKm = () => {
    const maxRadius = getCityRadiusKm();
    return [0, 0.15, 0.3, 0.5, 0.7, 1].map((ratio) => Number((maxRadius * ratio).toFixed(2)));
  };

  const getPanoramaAtPoint = (point, radius = getSearchRadiusMeters()) => new Promise((resolve) => {
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
    const radii = getProbeRadiiKm();
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
    const cityRadiusKm = getCityRadiusKm();
    const maxAllowedDistance = mode === 'yakutsk'
      ? Math.max(cityRadiusKm + 8, 22)
      : Math.max(cityRadiusKm + 4, 12);
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
      requestBudget: mode === 'yakutsk' ? 60 : 90,
    });

    let selectedCandidates = selectRoundsFromCandidates(phaseOneCandidates, historyCityNames);

    if (selectedCandidates.length < TOTAL_ROUNDS) {
      const selectedPanoIds = new Set(selectedCandidates.map((candidate) => candidate.panoId));
      const phaseTwoCandidates = await discoverCandidates({
        blockedPanoIds: new Set([...historyPanoIds, ...selectedPanoIds]),
        blockedCityNames: historyCityNames,
        allowBlockedCities: true,
        requestBudget: mode === 'yakutsk' ? 40 : 70,
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

  const getHelpRadiusKm = () => (mode === 'yakutsk' ? HELP_RADIUS_KM_YAKUTSK : HELP_RADIUS_KM_ALL);

  const getHelpCenter = (location) => {
    if (!location) return null;
    // Смещаем центр круга, чтобы точка не совпадала с искомой
    const maxOffsetKm = getHelpRadiusKm() * 0.6; // ?? 60% ???????
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
    if (mode === 'yakutsk') {
      if (distanceKm <= 0.3) return 5000;
      if (distanceKm <= 1) return Math.max(0, Math.round(5000 - ((distanceKm - 0.3) * 1000)));
      if (distanceKm <= 3) return Math.max(0, Math.round(4300 - ((distanceKm - 1) * 600)));
      if (distanceKm <= 5) return Math.max(0, Math.round(3100 - ((distanceKm - 3) * 400)));
      if (distanceKm <= 10) return Math.max(0, Math.round(2300 - ((distanceKm - 5) * 200)));
      if (distanceKm <= 20) return Math.max(0, Math.round(1300 - ((distanceKm - 10) * 80)));
      return 0;
    }
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
        helpRadiusKm={getHelpRadiusKm()}
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
