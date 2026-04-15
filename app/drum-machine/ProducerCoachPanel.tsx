"use client";

import type { CoachFeedback, MachineSnapshot } from "@/lib/producerCoach";

interface ProducerCoachPanelProps {
  authLoading: boolean;
  feedback: CoachFeedback;
  snapshot: MachineSnapshot;
  error: string;
  hasAnalyzed: boolean;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: string;
  remainingToday: number | null;
  userSignedIn: boolean;
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
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-zinc-200"
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

export function ProducerCoachPanel({
  authLoading,
  feedback,
  snapshot,
  error,
  hasAnalyzed,
  isLoading,
  isStale,
  lastUpdated,
  remainingToday,
  userSignedIn,
  onRefresh,
  onSignIn,
}: ProducerCoachPanelProps) {
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

      <div className="space-y-5">
        <Section title="What Is Missing" items={feedback.missingElements} />
        <Section title="What Feels Safe" items={feedback.tooSafe} />
        <Section title="Specific Moves" items={feedback.specificMoves} />
      </div>
    </aside>
  );
}
