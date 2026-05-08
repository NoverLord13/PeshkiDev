import type { Bounds, GameMode, LatLng, SeedLocation } from "./gameTypes.ts";

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

// Явный центр и стартовый зум миникарты. Геометрическая середина BOUNDS_BY_MODE
// смещена на юг из-за Покровска, поэтому центр задаём вручную — площадь Ленина.
export const MAP_VIEW_BY_MODE: Record<GameMode, { center: LatLng; zoom: number }> = {
  YAKUTSK: {
    center: { lat: 62.0272, lng: 129.7326 },
    zoom: 9,
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
