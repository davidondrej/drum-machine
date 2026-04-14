"use client";

import type { CoachFeedback, MachineSnapshot } from "@/lib/producerCoach";

interface ProducerCoachPanelProps {
  authLoading: boolean;
  feedback: CoachFeedback;
  snapshot: MachineSnapshot;
  error: string;
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
  isLoading,
  isStale,
  lastUpdated,
  remainingToday,
  userSignedIn,
  onRefresh,
  onSignIn,
}: ProducerCoachPanelProps) {
  const statusLabel = isLoading ? "Analyzing" : isStale ? "Out of date" : "Fresh";
  const activeDrums = snapshot.drums.filter((lane) => lane.hitCount > 0).length;

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
      <div className="mb-5 flex items-start justify-between gap-3">
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
          className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Status</div>
          <div className="mt-1 font-semibold text-white">{statusLabel}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Updated</div>
          <div className="mt-1 font-semibold text-white">{lastUpdated || "Waiting"}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Groove</div>
          <div className="mt-1 font-semibold text-white">
            {snapshot.bpm} BPM · {snapshot.synthWave}
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Density</div>
          <div className="mt-1 font-semibold text-white">
            {activeDrums} drum lanes · {snapshot.stats.totalMelodyHits} notes
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 col-span-2">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Quota</div>
          <div className="mt-1 font-semibold text-white">
            {remainingToday === null ? "Ready to analyze" : `${remainingToday} coach requests left today`}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="mb-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Read
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-100">{feedback.summary}</p>
        <p className="mt-3 text-xs leading-6 text-cyan-200/90">{feedback.producerNote}</p>
      </section>

      <div className="space-y-5">
        <Section title="What Is Missing" items={feedback.missingElements} />
        <Section title="What Feels Safe" items={feedback.tooSafe} />
        <Section title="Specific Moves" items={feedback.specificMoves} />
      </div>
    </aside>
  );
}
