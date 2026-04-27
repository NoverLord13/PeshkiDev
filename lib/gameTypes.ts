import type { YandexPanorama } from "./yandexMapsTypes.ts";

export type GameMode = "YAKUTSK";
export type GameState = "IDLE" | "LOADING_RESULT" | "GUESSING" | "RESULT" | "FINAL_RESULT";
export type Language = "ru" | "sah";

export type LatLng = {
  lat: number;
  lng: number;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type SeedLocation = {
  lat: number;
  lng: number;
  radiusMeters: number;
  weight?: number;
};

export type GeneratedRound = {
  location: LatLng;
  panorama: YandexPanorama;
};

export type PrefetchedRound = {
  mode: GameMode;
  data: GeneratedRound;
};
