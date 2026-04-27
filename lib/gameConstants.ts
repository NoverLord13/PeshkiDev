import type { Bounds, GameMode, SeedLocation } from "./gameTypes.ts";

export const TOTAL_ROUNDS = 5;

// Границы покрывают Якутск + ближайшие пригороды (Покровск, Марха, Жатай).
export const BOUNDS_BY_MODE: Record<GameMode, Bounds> = {
  YAKUTSK: {
    minLat: 61.43,
    maxLat: 62.18,
    minLng: 129.1,
    maxLng: 130.1,
  },
};

// В режим попадают сам Якутск и ближайшие населённые пункты. Сиды самого города оставлены
// отдельно (они дают плотное покрытие центра), а соседние посёлки добавлены по одному сиду.
export const YAKUTSK_LOCATION_SEEDS: SeedLocation[] = [
  { lat: 62.0272, lng: 129.7326, radiusMeters: 2200 }, // Якутск
  { lat: 62.035, lng: 129.675, radiusMeters: 2000 }, // Якутск
  { lat: 62.05, lng: 129.71, radiusMeters: 2000 }, // Якутск
  { lat: 62.01, lng: 129.69, radiusMeters: 2000 }, // Якутск
  { lat: 62.015, lng: 129.765, radiusMeters: 1800 }, // Якутск
  { lat: 61.995, lng: 129.735, radiusMeters: 1800 }, // Якутск
  { lat: 61.487, lng: 129.1455, radiusMeters: 1500 }, // Покровск
  { lat: 62.1328, lng: 129.6194, radiusMeters: 1500 }, // Марха
  { lat: 62.0908, lng: 130.0464, radiusMeters: 1500 }, // Жатай
];
