"use client";

import { useEffect, useRef, useState } from "react";
import {
  COACH_MODEL_OPTIONS,
  getCoachModelName,
  type CoachModelSlug,
} from "@/lib/coachModels";
import type { CoachFeedback } from "@/lib/producerCoach";

interface ProducerCoachPanelProps {
  authLoading: boolean;
  feedback: CoachFeedback;
  error: string;
  hasAnalyzed: boolean;
  isOnline: boolean;
  isLoading: boolean;
  isStale: boolean;
  remainingToday: number | null;
  selectedModel: CoachModelSlug;
  userSignedIn: boolean;
  onModelChange: (model: CoachModelSlug) => void;
  onRefresh: () => void;
  onSignIn: () => void;
}

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {title}
      </h3>
      <ul className="space-y-1.5 list-none">
        {items.map((item) => (
          <li
            key={item}
            className="relative pl-3 text-[13px] leading-relaxed text-zinc-300 before:absolute before:left-0 before:top-[0.45rem] before:h-1 before:w-1 before:rounded-full before:bg-zinc-600"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProducerCoachPanel({
  authLoading,
  feedback,
  error,
  hasAnalyzed,
  isOnline,
  isLoading,
  isStale,
  remainingToday,
  selectedModel,
  userSignedIn,
  onModelChange,
  onRefresh,
  onSignIn,
}: ProducerCoachPanelProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSelectorOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (authLoading) {
    return (
      <aside className="glass-panel h-fit rounded-[2rem] p-5 lg:sticky lg:top-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
          AI Producer Coach
        </p>
        <p className="mt-4 text-sm text-zinc-400">Checking session...</p>
      </aside>
    );
  }

  if (!userSignedIn) {
    return (
      <aside className="glass-panel h-fit rounded-[2rem] p-5 lg:sticky lg:top-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
          AI Producer Coach
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[0.08em] text-white">
          Sign In Required
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          The drum machine stays public. The coach is only for signed-in users so usage can be limited per account.
        </p>
        <button
          onClick={onSignIn}
          className="mt-5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
        >
          Sign In For Coach
        </button>
      </aside>
    );
  }

  if (!isOnline) {
    return (
      <aside className="glass-panel h-fit rounded-[2rem] p-5 lg:sticky lg:top-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
          AI Producer Coach
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[0.08em] text-white">
          Offline Right Now
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          The live machine still runs, but coach analysis needs a network connection.
        </p>
      </aside>
    );
  }

  return (
    <aside className="glass-panel h-fit rounded-[2rem] p-5 lg:sticky lg:top-6">
      <div className="mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
            AI Producer Coach
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[0.08em] text-white">
            Honest Feedback
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Reads the live pattern, BPM, and synth settings. No fake audio claims. Just arrangement advice.
          </p>
        </div>

        <div className="mt-5" ref={selectorRef}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Coach Model
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Active Now
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={isSelectorOpen}
              onClick={() => setIsSelectorOpen((open) => !open)}
              className="w-full rounded-[1.4rem] border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(0,210,255,0.14),rgba(255,79,216,0.14))] px-4 py-3 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(0,210,255,0.08)] transition duration-150 ease-out hover:border-cyan-300/45 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_30px_rgba(255,79,216,0.14)]"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-400">
                {getCoachModelName(selectedModel)}
              </span>
              <span className="mt-1 flex items-center justify-between gap-3 text-sm font-medium text-white">
                <span>{selectedModel}</span>
                <span className="text-lg leading-none text-cyan-200">{isSelectorOpen ? "−" : "+"}</span>
              </span>
            </button>

            {isSelectorOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 space-y-2 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.98),rgba(10,14,24,0.96))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                {COACH_MODEL_OPTIONS.map((option) => {
                  const isSelected = option.slug === selectedModel;

                  return (
                    <button
                      key={option.slug}
                      type="button"
                      onClick={() => {
                        onModelChange(option.slug);
                        setIsSelectorOpen(false);
                      }}
                      className={`w-full rounded-[1.15rem] border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-cyan-300/50 bg-[linear-gradient(135deg,rgba(0,210,255,0.18),rgba(255,79,216,0.18))] shadow-[0_0_20px_rgba(0,210,255,0.12)]"
                          : "border-white/6 bg-white/[0.03] hover:border-cyan-400/25 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-white">
                            {option.name}
                          </span>
                          <span className="mt-1 block text-xs text-zinc-400">{option.slug}</span>
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
                            isSelected
                              ? "bg-cyan-300/20 text-cyan-100"
                              : "bg-white/6 text-zinc-500"
                          }`}
                        >
                          {isSelected ? "Selected" : "Switch"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading || !userSignedIn}
          className="mt-6 w-full rounded-full bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-[0.24em] text-black shadow-lg transition duration-150 ease-out hover:scale-[1.02] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? "Analyzing..." : hasAnalyzed ? "Refresh Analysis" : "Analyze"}
        </button>
        
        <div className="mt-3 text-center text-xs font-medium text-zinc-500">
          {remainingToday === null ? "Ready to analyze" : `${remainingToday} requests left today`}
          {hasAnalyzed && !isLoading && isStale && " • Pattern changed"}
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-sm leading-7 text-zinc-100">{feedback.summary}</p>
        <p className="mt-2 text-xs leading-6 text-zinc-400">
          {hasAnalyzed
            ? feedback.producerNote
            : "Press Analyze when you want feedback on the current pattern."}
        </p>
      </div>

      <div className="space-y-4">
        <Section title="What Is Missing" items={feedback.missingElements} />
        <Section title="What Feels Safe" items={feedback.tooSafe} />
        <Section title="Specific Moves" items={feedback.specificMoves} />
      </div>
    </aside>
  );
}
