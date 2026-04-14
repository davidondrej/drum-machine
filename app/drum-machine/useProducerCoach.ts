"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_COACH_FEEDBACK,
  normalizeCoachFeedback,
  type CoachFeedback,
  type MachineSnapshot,
} from "@/lib/producerCoach";

interface ProducerCoachState {
  feedback: CoachFeedback;
  error: string;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: string;
  remainingToday: number | null;
  refresh: () => void;
}

export function useProducerCoach(
  snapshot: MachineSnapshot,
  enabled: boolean
): ProducerCoachState {
  const [feedback, setFeedback] = useState<CoachFeedback>(EMPTY_COACH_FEEDBACK);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const snapshotKey = JSON.stringify(snapshot);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);
  const refreshRef = useRef<() => void>(() => undefined);

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
        body: JSON.stringify({ snapshot }),
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
  }, [enabled, snapshot]);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      hasLoadedRef.current = false;
      setFeedback(EMPTY_COACH_FEEDBACK);
      setError("");
      setIsLoading(false);
      setIsStale(false);
      setLastUpdated("");
      setRemainingToday(null);
      return;
    }

    if (hasLoadedRef.current) {
      setIsStale(true);
    }

    const timeoutId = window.setTimeout(() => {
      void refreshRef.current();
    }, 1300);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, snapshotKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    feedback,
    error,
    isLoading,
    isStale,
    lastUpdated,
    remainingToday,
    refresh: () => {
      void refresh();
    },
  };
}
