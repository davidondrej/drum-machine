"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_COACH_FEEDBACK,
  normalizeCoachFeedback,
  type CoachFeedback,
  type MachineSnapshot,
} from "@/lib/producerCoach";
import type { CoachModelSlug } from "@/lib/coachModels";

/**
 * Client request lifecycle for the AI coach.
 * It separates stale/loading/error state from the snapshot-building logic in `lib/producerCoach.ts`.
 */
interface ProducerCoachState {
  feedback: CoachFeedback;
  error: string;
  hasAnalyzed: boolean;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: string;
  remainingToday: number | null;
  refresh: () => void;
}

export function useProducerCoach(
  snapshot: MachineSnapshot,
  enabled: boolean,
  model: CoachModelSlug
): ProducerCoachState {
  const [feedback, setFeedback] = useState<CoachFeedback>(EMPTY_COACH_FEEDBACK);
  const [error, setError] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const snapshotKey = JSON.stringify(snapshot);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot, model }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | { feedback?: unknown; error?: string; remaining?: number }
        | null;

      if (!response.ok) {
        setRemainingToday(typeof payload?.remaining === "number" ? payload.remaining : null);
        throw new Error(payload?.error || "The coach could not respond.");
      }

      setFeedback(normalizeCoachFeedback(payload?.feedback));
      setRemainingToday(typeof payload?.remaining === "number" ? payload.remaining : null);
      setHasAnalyzed(true);
      setIsStale(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      hasLoadedRef.current = true;
    } catch (caught) {
      if (controller.signal.aborted) {
        return;
      }

      setError(caught instanceof Error ? caught.message : "The coach could not respond.");
      setIsStale(hasLoadedRef.current);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  }, [enabled, model, snapshot]);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      hasLoadedRef.current = false;
      setFeedback(EMPTY_COACH_FEEDBACK);
      setError("");
      setHasAnalyzed(false);
      setIsLoading(false);
      setIsStale(false);
      setLastUpdated("");
      setRemainingToday(null);
      return;
    }

    // Once a successful analysis exists, any snapshot change marks it stale until the user refreshes.
    if (hasLoadedRef.current) {
      setIsStale(true);
    }
  }, [enabled, snapshotKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    feedback,
    error,
    hasAnalyzed,
    isLoading,
    isStale,
    lastUpdated,
    remainingToday,
    refresh: () => {
      void refresh();
    },
  };
}
