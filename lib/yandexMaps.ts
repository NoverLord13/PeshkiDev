import type { LatLng } from "./gameTypes.ts";
import type { YandexGeoObject, YandexGeocoderMetaData, YandexMapsApi } from "./yandexMapsTypes.ts";

export type {
  YandexEvent,
  YandexGeoObjectCollectionMap,
  YandexGeocodeResponse,
  YandexGeocoderMetaData,
  YandexMapInstance,
  YandexMapsApi,
  YandexPanorama,
  YandexPanoramaPlayer,
  YandexPlacemark,
  YandexPolyline,
} from "./yandexMapsTypes.ts";

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
  }
}

const YANDEX_MAPS_URL = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
const YANDEX_SCRIPT_STATUS_ATTR = "data-yandex-maps-status";
const YANDEX_LOAD_ERROR_MESSAGE = "Yandex Maps failed to load";

let yandexMapsLoadPromise: Promise<YandexMapsApi> | null = null;

export class StreetViewService {
  constructor(private readonly ymaps: YandexMapsApi) {}

  /** Сырой список панорам (ближние первыми). Нужен, чтобы не застревать на одной и той же `panoramas[0]`. */
  async locatePanoramasNear(location: LatLng, radiusMeters: number) {
    const panoramas = await this.ymaps.panorama.locate([location.lat, location.lng], {
      radius: radiusMeters,
      layer: "yandex#panorama",
    });
    return panoramas && panoramas.length > 0 ? panoramas : [];
  }

  async getPanorama(request: { location: LatLng; radius: number; source: "OUTDOOR" }) {
    const panoramas = await this.locatePanoramasNear(request.location, request.radius);

    if (panoramas.length === 0) {
      return { status: "ZERO_RESULTS" as const };
    }

    const panorama = panoramas[0];
    const position = panorama.getPosition();

    return {
      status: "OK" as const,
      location: { lat: position[0], lng: position[1] },
      panorama,
    };
  }
}

const getApiKeyCandidateUrls = () => {
  const candidates = [
    new URL("api-key.txt", document.baseURI).toString(),
    `${window.location.origin}/api-key.txt`,
  ];

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }

    seen.add(candidate);
    return true;
  });
};

const getYandexMapsApiKeyFromEnv = () => {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  if (!apiKey || apiKey === "your-yandex-maps-api-key") {
    return null;
  }

  return apiKey;
};

const getYandexMapsApiKey = async () => {
  const envApiKey = getYandexMapsApiKeyFromEnv();
  if (envApiKey) {
    return envApiKey;
  }

  const candidateUrls = getApiKeyCandidateUrls();

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const apiKey = (await response.text()).trim();
      if (apiKey) {
        return apiKey;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `Не удалось загрузить API-ключ. Укажите VITE_YANDEX_MAPS_API_KEY или файл api-key.txt. Проверенные пути: ${candidateUrls.join(", ")}`
  );
};

export const loadYandexMaps = async () => {
  if (window.ymaps) {
    return new Promise<YandexMapsApi>((resolve) => {
      window.ymaps?.ready(() => resolve(window.ymaps as YandexMapsApi));
    });
  }

  const apiKey = await getYandexMapsApiKey();
  const scriptSrc = `${YANDEX_MAPS_URL}&apikey=${encodeURIComponent(apiKey)}`;

  if (yandexMapsLoadPromise) {
    return yandexMapsLoadPromise;
  }

  const waitForReady = () =>
    new Promise<YandexMapsApi>((resolve, reject) => {
      if (!window.ymaps) {
        reject(new Error(YANDEX_LOAD_ERROR_MESSAGE));
        return;
      }

      window.ymaps.ready(() => resolve(window.ymaps as YandexMapsApi));
    });

  const attachToScript = (script: HTMLScriptElement) =>
    new Promise<YandexMapsApi>((resolve, reject) => {
      const cleanup = () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };

      const handleLoad = () => {
        script.setAttribute(YANDEX_SCRIPT_STATUS_ATTR, "loaded");
        cleanup();
        void waitForReady().then(resolve, reject);
      };

      const handleError = () => {
        script.setAttribute(YANDEX_SCRIPT_STATUS_ATTR, "error");
        cleanup();
        script.remove();
        reject(new Error(YANDEX_LOAD_ERROR_MESSAGE));
      };

      const status = script.getAttribute(YANDEX_SCRIPT_STATUS_ATTR);
      if (status === "loaded") {
        handleLoad();
        return;
      }

      if (status === "error") {
        script.remove();
      }

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
    });

  yandexMapsLoadPromise = (async () => {
    let script = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.setAttribute(YANDEX_SCRIPT_STATUS_ATTR, "loading");
      document.head.appendChild(script);
    }

    return attachToScript(script);
  })();

  try {
    return await yandexMapsLoadPromise;
  } catch (error) {
    yandexMapsLoadPromise = null;
    throw error;
  }
};

export const extractAdminLevel1 = (geocodeResult: YandexGeoObject | null | undefined) => {
  const meta = geocodeResult?.properties?.get("metaDataProperty.GeocoderMetaData") as YandexGeocoderMetaData | undefined;
  const components = meta?.Address?.Components || [];

  for (const component of components) {
    if (component.kind === "province") {
      return component.name ?? null;
    }
  }

  for (const component of components) {
    if (component.kind === "area") {
      return component.name ?? null;
    }
  }

  return meta?.text ?? null;
};
