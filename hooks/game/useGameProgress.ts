import { useCallback, useMemo, useState } from "react";
import { TOTAL_ROUNDS } from "../../lib/gameConstants.ts";
import type { GameMode, GameState, LatLng } from "../../lib/gameTypes.ts";
import type { MainUiText } from "../../lib/uiText.ts";
import type { YandexPanorama } from "../../lib/yandexMaps.ts";
import type { RoundSummary } from "./types.ts";

export const useGameProgress = (uiText: MainUiText) => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [targetLocation, setTargetLocation] = useState<LatLng | null>(null);
  const [targetPanorama, setTargetPanorama] = useState<YandexPanorama | null>(null);
  const [guessLocation, setGuessLocation] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundHistory, setRoundHistory] = useState<RoundSummary[]>([]);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(uiText.loadingMap);
  const [roundError, setRoundError] = useState<string | null>(null);

  const isFinalRound = currentRound >= TOTAL_ROUNDS;
  const averageScore = useMemo(
    () =>
      roundHistory.length
        ? Math.round(roundHistory.reduce((sum, round) => sum + round.score, 0) / roundHistory.length)
        : 0,
    [roundHistory]
  );
  const totalDistance = useMemo(
    () => roundHistory.reduce((sum, round) => sum + round.distanceKm, 0),
    [roundHistory]
  );
  const bestRound = useMemo(
    () => roundHistory.reduce<RoundSummary | null>((best, round) => (!best || round.score > best.score ? round : best), null),
    [roundHistory]
  );

  const resetRoundState = useCallback(() => {
    setGuessLocation(null);
    setTargetLocation(null);
    setTargetPanorama(null);
    setDistance(null);
    setScore(0);
  }, []);

  const resetSession = useCallback(() => {
    setGameMode(null);
    setGameState("IDLE");
    setCurrentRound(1);
    setRoundHistory([]);
    setTotalXP(0);
    setShareFeedback(null);
    setRoundError(null);
    resetRoundState();
  }, [resetRoundState]);

  const beginGame = useCallback((mode: GameMode) => {
    setCurrentRound(1);
    setRoundHistory([]);
    setTotalXP(0);
    setDistance(null);
    setScore(0);
    setShareFeedback(null);
    setRoundError(null);
    setGameMode(mode);
  }, []);

  const completeGuess = useCallback((summary: RoundSummary, nextDistance: number, nextScore: number, checkingResultText: string) => {
    setGameState("LOADING_RESULT");
    setLoadingMessage(checkingResultText);
    setDistance(nextDistance);
    setScore(nextScore);
    setTotalXP((prev) => prev + nextScore);
    setRoundHistory((prev) => [...prev, summary]);
    setGameState("RESULT");
  }, []);

  const syncLoadingMessage = useCallback(() => {
    if (gameState === "LOADING_RESULT" && !targetLocation && !roundError) {
      setLoadingMessage(uiText.loadingRound);
    }
  }, [gameState, targetLocation, roundError, uiText.loadingRound]);

  return {
    gameMode,
    gameState,
    targetLocation,
    targetPanorama,
    guessLocation,
    distance,
    score,
    totalXP,
    currentRound,
    roundHistory,
    shareFeedback,
    loadingMessage,
    roundError,
    isFinalRound,
    averageScore,
    totalDistance,
    bestRound,
    setGameMode,
    setGameState,
    setTargetLocation,
    setTargetPanorama,
    setGuessLocation,
    setDistance,
    setScore,
    setCurrentRound,
    setRoundHistory,
    setShareFeedback,
    setLoadingMessage,
    setRoundError,
    resetRoundState,
    resetSession,
    beginGame,
    completeGuess,
    syncLoadingMessage,
  };
};
