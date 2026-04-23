import { useCallback, useRef } from "react";
import { SAKHA_LOCATION_SEEDS } from "../../lib/gameConstants.ts";
import { getErrorMessage } from "../../lib/errors.ts";
import type { GameMode, GeneratedRound, LatLng, SeedLocation } from "../../lib/gameTypes.ts";
import {
  buildShuffledIndexOrder,
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

const YAKUTSK_SEARCH_RADIUS_M = 1500;
const MAX_YAKUTSK_DRIFT_KM = 1.5;
const YAKUTSK_BATCH_SIZE = 5;
const YAKUTSK_MAX_BATCHES = 24;

// Дешёвый режим для всей республики: максимум 2 locate на населённый пункт,
// без многоточечного probing, который и сжигал API-лимит.
const SAKHA_SEARCH_RADIUS_M = 2500;
const SAKHA_ATTEMPTS_PER_SETTLEMENT = 2;
const SAKHA_CANDIDATE_LIST_LIMIT = 8;
const SAKHA_REUSE_KEY_PRECISION = 5;

const isConfigurationErrorMessage = (message: string) =>
  /api[- ]?key|failed to load|unauthorized|forbidden|access denied/i.test(message);

type CachedPanoramaCandidate = GeneratedRound & {
  key: string;
};

type SakhaTryResult = {
  round: GeneratedRound | null;
  sawQualifyingPanorama: boolean;
};

const getSakhaMaxDistanceKm = (seed: SeedLocation) =>
  Math.max(1.6, Math.min(4.2, (seed.radiusMeters / 1000) * 1.8));

const buildPanoramaKey = (location: LatLng) =>
  `${location.lat.toFixed(SAKHA_REUSE_KEY_PRECISION)}:${location.lng.toFixed(
    SAKHA_REUSE_KEY_PRECISION
  )}`;

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
  const sakhaSessionOrder = useRef<number[] | null>(null);
  const sakhaUsedSeedIndices = useRef<Set<number>>(new Set());
  const sakhaUnavailableSeedIndices = useRef<Set<number>>(new Set());
  // Не очищаем между играми сразу: это помогает не получать одну и ту же панораму
  // на каждом новом запуске, пока в посёлке есть альтернативы.
  const sakhaUsedPanoramaKeys = useRef<Set<string>>(new Set());

  const tryYakutskCandidate = useCallback(async (): Promise<GeneratedRound | null> => {
    if (!streetViewService) {
      throw new Error("Сервисы карты недоступны");
    }

    const bounds = getBoundsForMode("YAKUTSK");
    const candidate = generateCandidateLocation("YAKUTSK", bounds);
    const panorama = await streetViewService.getPanorama({
      location: candidate,
      radius: YAKUTSK_SEARCH_RADIUS_M,
      source: "OUTDOOR",
    });

    if (panorama.status === "ZERO_RESULTS" || !panorama.location) {
      return null;
    }

    if (!isWithinBounds(panorama.location, bounds)) {
      return null;
    }

    if (haversineKm(candidate, panorama.location) > MAX_YAKUTSK_DRIFT_KM) {
      return null;
    }

    return {
      location: panorama.location,
      panorama: panorama.panorama,
    };
  }, [streetViewService]);

  const trySakhaSettlement = useCallback(
    async (seedIndex: number, allowRepeatedPanoramas: boolean): Promise<SakhaTryResult> => {
      if (!streetViewService) {
        throw new Error("Сервисы карты недоступны");
      }

      const seed = SAKHA_LOCATION_SEEDS[seedIndex];
      if (!seed) {
        return { round: null, sawQualifyingPanorama: false };
      }

      const bounds = getBoundsForMode("SAKHA");
      const maxDistanceKm = getSakhaMaxDistanceKm(seed);
      let sawQualifyingPanorama = false;

      for (let attempt = 0; attempt < SAKHA_ATTEMPTS_PER_SETTLEMENT; attempt += 1) {
        const candidate = generateCandidateLocation("SAKHA", bounds, { sakhaSeedIndex: seedIndex });
        const panoramas = await streetViewService.locatePanoramasNear(candidate, SAKHA_SEARCH_RADIUS_M);
        const candidates: CachedPanoramaCandidate[] = [];

        for (const panorama of panoramas.slice(0, SAKHA_CANDIDATE_LIST_LIMIT)) {
          const position = panorama.getPosition();
          const location = { lat: position[0], lng: position[1] };

          if (!isWithinBounds(location, bounds)) {
            continue;
          }

          if (haversineKm({ lat: seed.lat, lng: seed.lng }, location) > maxDistanceKm) {
            continue;
          }

          sawQualifyingPanorama = true;

          const key = buildPanoramaKey(location);
          if (!allowRepeatedPanoramas && sakhaUsedPanoramaKeys.current.has(key)) {
            continue;
          }

          candidates.push({
            key,
            location,
            panorama,
          });
        }

        if (candidates.length === 0) {
          continue;
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
        sakhaUsedPanoramaKeys.current.add(pick.key);

        return {
          round: {
            location: pick.location,
            panorama: pick.panorama,
          },
          sawQualifyingPanorama: true,
        };
      }

      return { round: null, sawQualifyingPanorama };
    },
    [streetViewService]
  );

  const generateValidLocation = useCallback(
    async (mode: GameMode, roundNumber: number): Promise<GeneratedRound> => {
      if (!streetViewService) {
        throw new Error("Сервисы карты недоступны");
      }

      if (mode === "YAKUTSK") {
        let lastConfigError: Error | null = null;

        for (let batch = 0; batch < YAKUTSK_MAX_BATCHES; batch += 1) {
          const attempts = Array.from({ length: YAKUTSK_BATCH_SIZE }, () =>
            tryYakutskCandidate().catch((error: unknown) => {
              const message = getErrorMessage(error, "");
              if (isConfigurationErrorMessage(message)) {
                lastConfigError = new Error(message);
              } else {
                console.warn("Yakutsk round generation attempt failed.", error);
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
      }

      if (roundNumber === 1 || !sakhaSessionOrder.current) {
        sakhaSessionOrder.current = buildShuffledIndexOrder(SAKHA_LOCATION_SEEDS.length);
        sakhaUsedSeedIndices.current = new Set();
        sakhaUnavailableSeedIndices.current = new Set();
      }

      const order = sakhaSessionOrder.current;
      const usedSettlements = sakhaUsedSeedIndices.current;
      const unavailableSettlements = sakhaUnavailableSeedIndices.current;

      const attemptSakhaRound = async (allowRepeatedPanoramas: boolean) => {
        let lastConfigError: Error | null = null;

        for (const seedIndex of order) {
          if (usedSettlements.has(seedIndex) || unavailableSettlements.has(seedIndex)) {
            continue;
          }

          try {
            const result = await trySakhaSettlement(seedIndex, allowRepeatedPanoramas);

            if (result.round) {
              usedSettlements.add(seedIndex);
              return { found: result.round, lastConfigError: null as Error | null };
            }

            if (!result.sawQualifyingPanorama) {
              // Этот населённый пункт в рамках текущей игры считаем "пустым" и больше не трогаем.
              unavailableSettlements.add(seedIndex);
            }
          } catch (error: unknown) {
            const message = getErrorMessage(error, "");
            if (isConfigurationErrorMessage(message)) {
              lastConfigError = new Error(message);
              break;
            }

            console.warn("Sakha settlement generation attempt failed.", error);
          }
        }

        return { found: null as GeneratedRound | null, lastConfigError };
      };

      const firstPass = await attemptSakhaRound(false);
      if (firstPass.lastConfigError) {
        throw firstPass.lastConfigError;
      }
      if (firstPass.found) {
        return firstPass.found;
      }

      // Если свежих панорам уже не осталось, разрешаем повторное использование ранее показанных
      // сцен, но только как резервный вариант вместо жёсткой ошибки.
      if (sakhaUsedPanoramaKeys.current.size > 0) {
        sakhaUsedPanoramaKeys.current.clear();
        const secondPass = await attemptSakhaRound(false);
        if (secondPass.lastConfigError) {
          throw secondPass.lastConfigError;
        }
        if (secondPass.found) {
          return secondPass.found;
        }
      }

      throw new Error("Не удалось найти подходящую локацию");
    },
    [streetViewService, trySakhaSettlement, tryYakutskCandidate]
  );

  const startNewRound = useCallback(
    async (mode: GameMode, roundNumber: number) => {
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
        const roundData = await generateValidLocation(mode, roundNumber);
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
