import type { Bounds, GameMode, SeedLocation } from "./gameTypes.ts";

export const TOTAL_ROUNDS = 5;

export const BOUNDS_BY_MODE: Record<GameMode, Bounds> = {
  YAKUTSK: {
    minLat: 61.95,
    maxLat: 62.1,
    minLng: 129.55,
    maxLng: 129.85,
  },
  SAKHA: {
    minLat: 55.0,
    maxLat: 72.0,
    minLng: 105.0,
    maxLng: 160.0,
  },
};

// Сиды внутри Якутска намеренно не входят: для столицы есть отдельный режим. Иначе из-за весов
// и высокой плотности панорам в городе в «вся республика» визуально остаётся одна столица.
export const SAKHA_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.5354, lng: 113.9559, radiusMeters: 2000, weight: 1 }, // Мирный
  { lat: 56.6655, lng: 124.6418, radiusMeters: 2000, weight: 1 }, // Нерюнгри
  { lat: 58.6094, lng: 125.3805, radiusMeters: 1500, weight: 1 }, // Алдан
  { lat: 60.7274, lng: 114.8389, radiusMeters: 1500, weight: 1 }, // Ленск
  { lat: 66.4147, lng: 112.4047, radiusMeters: 1200, weight: 1 }, // Удачный
  { lat: 61.487, lng: 129.1455, radiusMeters: 1500, weight: 1 }, // Покровск
  { lat: 60.3766, lng: 120.4108, radiusMeters: 1500, weight: 1 }, // Олёкминск
  { lat: 63.751, lng: 121.6164, radiusMeters: 1500, weight: 1 }, // Вилюйск
  { lat: 63.2842, lng: 118.3343, radiusMeters: 1500, weight: 1 }, // Нюрба
  { lat: 62.1432, lng: 117.6308, radiusMeters: 1500, weight: 1 }, // Сунтар
  { lat: 62.0908, lng: 130.0464, radiusMeters: 1500, weight: 1 }, // Жатай
  { lat: 62.0167, lng: 132.4333, radiusMeters: 1500, weight: 1 }, // Чурапча
  { lat: 62.7167, lng: 129.6667, radiusMeters: 1500, weight: 1 }, // Намцы
  { lat: 61.8731, lng: 130.5683, radiusMeters: 1500, weight: 1 }, // Майя
  { lat: 62.6586, lng: 135.5953, radiusMeters: 1500, weight: 1 }, // Хандыга
  { lat: 64.5645, lng: 143.2247, radiusMeters: 1500, weight: 1 }, // Усть-Нера
  { lat: 67.5511, lng: 133.3914, radiusMeters: 1200, weight: 1 }, // Верхоянск
  { lat: 71.6872, lng: 128.8694, radiusMeters: 1200, weight: 1 }, // Тикси
  { lat: 62.095, lng: 126.6975, radiusMeters: 1200, weight: 1 }, // Бердигестях
  { lat: 62.4731, lng: 133.6708, radiusMeters: 1200, weight: 1 }, // Ытык-Кюёль
  { lat: 67.4628, lng: 153.6817, radiusMeters: 1200, weight: 1 }, // Среднеколымск
];

export const YAKUTSK_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 2200 },
  { lat: 62.035, lng: 129.675, radiusMeters: 2000 },
  { lat: 62.05, lng: 129.71, radiusMeters: 2000 },
  { lat: 62.01, lng: 129.69, radiusMeters: 2000 },
  { lat: 62.015, lng: 129.765, radiusMeters: 1800 },
  { lat: 61.995, lng: 129.735, radiusMeters: 1800 },
];
