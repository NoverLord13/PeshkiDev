import { useCallback, useRef } from "react";
import { getErrorMessage } from "../../lib/errors.ts";
import type { GameMode, GeneratedRound } from "../../lib/gameTypes.ts";
import {
  generateCandidateLocation,
  getBoundsForMode,
  haversineKm,
  isWithinBounds,
} from "../../lib/mapUtils.ts";
import type { MainUiText } from "../../lib/uiText.ts";
import type { StreetViewService } from "../../lib/yandexMaps.ts";

type UseRoundGenerationOptions = {
  uiText: MainUiText;
  streetViewService: StreetViewService | null;
  setExternalError: (value: string | null) => void;
  resetRoundState: () => void;
  setShareFeedback: (value: string | null) => void;
  setLoadingMessage: (value: string) => void;
  setGameState: (value: "LOADING_RESULT" | "GUESSING") => void;
  setTargetLocation: (value: GeneratedRound["location"] | null) => void;
  setTargetPanorama: (value: GeneratedRound["panorama"] | null) => void;
};

const SEARCH_RADIUS_M = 1500;
const MAX_DRIFT_KM = 1.5;
const BATCH_SIZE = 5;
const MAX_BATCHES = 24;

const isConfigurationErrorMessage = (message: string) =>
  /api[- ]?key|failed to load|unauthorized|forbidden|access denied/i.test(message);

export const useRoundGeneration = ({
  uiText,
  streetViewService,
  setExternalError,
  resetRoundState,
  setShareFeedback,
  setLoadingMessage,
  setGameState,
  setTargetLocation,
  setTargetPanorama,
}: UseRoundGenerationOptions) => {
  const generationLock = useRef(false);

  const tryCandidate = useCallback(async (mode: GameMode): Promise<GeneratedRound | null> => {
    if (!streetViewService) {
      throw new Error("Сервисы карты недоступны");
    }

    const bounds = getBoundsForMode(mode);
    const candidate = generateCandidateLocation(mode, bounds);
    const panorama = await streetViewService.getPanorama({
      location: candidate,
      radius: SEARCH_RADIUS_M,
      source: "OUTDOOR",
    });

    if (panorama.status === "ZERO_RESULTS" || !panorama.location) {
      return null;
    }

    if (!isWithinBounds(panorama.location, bounds)) {
      return null;
    }

    if (haversineKm(candidate, panorama.location) > MAX_DRIFT_KM) {
      return null;
    }

    return {
      location: panorama.location,
      panorama: panorama.panorama,
    };
  }, [streetViewService]);

  const generateValidLocation = useCallback(
    async (mode: GameMode): Promise<GeneratedRound> => {
      if (!streetViewService) {
        throw new Error("Сервисы карты недоступны");
      }

      let lastConfigError: Error | null = null;

      for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
        const attempts = Array.from({ length: BATCH_SIZE }, () =>
          tryCandidate(mode).catch((error: unknown) => {
            const message = getErrorMessage(error, "");
            if (isConfigurationErrorMessage(message)) {
              lastConfigError = new Error(message);
            } else {
              console.warn("Round generation attempt failed.", error);
            }
            return null;
          })
        );

        const results = await Promise.all(attempts);
        const found = results.find((item): item is GeneratedRound => item !== null);
        if (found) {
          return found;
        }

        if (lastConfigError) {
          throw lastConfigError;
        }
      }

      throw new Error("Не удалось найти подходящую локацию");
    },
    [streetViewService, tryCandidate]
  );

  const startNewRound = useCallback(
    async (mode: GameMode, _roundNumber: number) => {
      if (generationLock.current) {
        return;
      }

      generationLock.current = true;
      setExternalError(null);
      setLoadingMessage(uiText.loadingRound);
      setGameState("LOADING_RESULT");
      setShareFeedback(null);
      resetRoundState();

      try {
        const roundData = await generateValidLocation(mode);
        setTargetLocation(roundData.location);
        setTargetPanorama(roundData.panorama);
        setGameState("GUESSING");
      } catch (error) {
        setExternalError(getErrorMessage(error, uiText.error));
      } finally {
        generationLock.current = false;
      }
    },
    [
      generateValidLocation,
      resetRoundState,
      setExternalError,
      setGameState,
      setLoadingMessage,
      setShareFeedback,
      setTargetLocation,
      setTargetPanorama,
      uiText.error,
      uiText.loadingRound,
    ]
  );

  return { startNewRound };
};
