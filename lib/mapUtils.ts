import { BOUNDS_BY_MODE, YAKUTSK_LOCATION_SEEDS } from "./gameConstants.ts";
import type { Bounds, GameMode, LatLng, SeedLocation } from "./gameTypes.ts";

const normalizeRegionName = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/giu, " ")
    .trim();

export const isSakhaRegion = (value: string | null | undefined) => {
  const normalized = normalizeRegionName(value);
  return normalized.includes("саха") || normalized.includes("якут");
};

export const isWithinBounds = (location: LatLng, bounds: Bounds) =>
  location.lat >= bounds.minLat &&
  location.lat <= bounds.maxLat &&
  location.lng >= bounds.minLng &&
  location.lng <= bounds.maxLng;

const toRad = (value: number) => (value * Math.PI) / 180;

export const haversineKm = (a: LatLng, b: LatLng) => {
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.sqrt(h));
};

const MAX_SCORE = 5000;

const SCORE_HALF_DISTANCE_KM: Record<GameMode, number> = {
  // Inside Yakutsk and its suburbs even a few kilometers is a meaningful miss.
  YAKUTSK: 2.5,
};

export const scoreFromDistance = (distanceKm: number, mode: GameMode) => {
  const halfDistanceKm = SCORE_HALF_DISTANCE_KM[mode];
  return Math.max(0, Math.round(MAX_SCORE * Math.pow(0.5, distanceKm / halfDistanceKm)));
};

export const metersToDelta = (meters: number, lat: number) => {
  const deltaLat = meters / 111320;
  const cosLat = Math.cos(toRad(lat));
  const safeCosLat = Math.abs(cosLat) < 0.0001 ? 0.0001 : cosLat;
  const deltaLng = meters / (111320 * safeCosLat);
  return { deltaLat, deltaLng };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const randomLatLngNearSeed = (seed: SeedLocation, bounds: Bounds): LatLng => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * seed.radiusMeters;
  const northOffsetMeters = Math.cos(angle) * distance;
  const eastOffsetMeters = Math.sin(angle) * distance;
  const lat = seed.lat + northOffsetMeters / 111320;
  const lng = seed.lng + eastOffsetMeters / (111320 * Math.max(Math.cos(toRad(seed.lat)), 0.0001));

  return {
    lat: clamp(lat, bounds.minLat, bounds.maxLat),
    lng: clamp(lng, bounds.minLng, bounds.maxLng),
  };
};

const pickWeightedSeed = (seeds: readonly SeedLocation[]): SeedLocation => {
  const totalWeight = seeds.reduce((sum, seed) => sum + (seed.weight ?? 1), 0);
  if (totalWeight <= 0) {
    return seeds[Math.floor(Math.random() * seeds.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const seed of seeds) {
    roll -= seed.weight ?? 1;
    if (roll <= 0) {
      return seed;
    }
  }

  return seeds[seeds.length - 1];
};

export const generateCandidateLocation = (_mode: GameMode, bounds: Bounds) =>
  randomLatLngNearSeed(pickWeightedSeed(YAKUTSK_LOCATION_SEEDS), bounds);

export const getBoundsForMode = (mode: GameMode) => BOUNDS_BY_MODE[mode];
