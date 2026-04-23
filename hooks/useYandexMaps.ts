import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errors.ts";
import { loadYandexMaps, StreetViewService, type YandexMapsApi } from "../lib/yandexMaps.ts";

export const useYandexMaps = (fallbackErrorMessage: string) => {
  const [ymapsApi, setYmapsApi] = useState<YandexMapsApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadYandexMaps()
      .then((api) => {
        if (mounted) {
          setError(null);
          setYmapsApi(api);
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setError(getErrorMessage(loadError, fallbackErrorMessage));
        }
      });

    return () => {
      mounted = false;
    };
  }, [fallbackErrorMessage]);

  const streetViewService = useMemo(() => (ymapsApi ? new StreetViewService(ymapsApi) : null), [ymapsApi]);

  return {
    ymapsApi,
    streetViewService,
    isMapReady: Boolean(ymapsApi && streetViewService),
    error,
    setError,
  };
};
