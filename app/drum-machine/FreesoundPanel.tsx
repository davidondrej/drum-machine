"use client";

import { useEffect, useRef, useState } from "react";
import type { DrumSampleAssignment, FreesoundSound } from "@/lib/freesound";

interface FreesoundPanelProps {
  selectedPadColor: string;
  selectedPadName: string;
  selectedPadSample: DrumSampleAssignment | null;
  isAssigningSample: boolean;
  sampleError: string;
  onAssignSample: (sound: FreesoundSound) => Promise<void>;
}

export function FreesoundPanel({
  selectedPadColor,
  selectedPadName,
  selectedPadSample,
  isAssigningSample,
  sampleError,
  onAssignSample,
}: FreesoundPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FreesoundSound[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (nextQuery.length < 2) {
      setSearchError("Type at least 2 characters.");
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(`/api/freesound?q=${encodeURIComponent(nextQuery)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; results?: FreesoundSound[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Search failed.");
      }

      setResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (error) {
      setResults([]);
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  function togglePreview(sound: FreesoundSound) {
    const current = previewAudioRef.current;
    if (current && previewingId === sound.id) {
      current.pause();
      current.currentTime = 0;
      previewAudioRef.current = null;
      setPreviewingId(null);
      return;
    }

    current?.pause();

    const audio = new Audio(sound.previewUrl);
    audio.onended = () => {
      previewAudioRef.current = null;
      setPreviewingId(null);
    };
    audio.onerror = () => {
      previewAudioRef.current = null;
      setPreviewingId(null);
      setSearchError("Preview playback failed.");
    };

    previewAudioRef.current = audio;
    setPreviewingId(sound.id);
    void audio.play().catch(() => {
      previewAudioRef.current = null;
      setPreviewingId(null);
      setSearchError("Preview playback failed.");
    });
  }

  return (
    <section className="glass-panel w-full max-w-5xl rounded-[2rem] p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">
            Freesound Loader
          </p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.18em] text-white">
            Load Sample Into {selectedPadName}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Search Freesound, preview a hit, then click the row to replace the selected pad.
          </p>
        </div>

        <div
          className="rounded-2xl border px-4 py-3 text-right"
          style={{
            borderColor: `${selectedPadColor}55`,
            backgroundColor: `${selectedPadColor}18`,
            boxShadow: `0 0 24px ${selectedPadColor}20`,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
            Selected Pad
          </p>
          <p className="mt-1 text-sm font-bold" style={{ color: selectedPadColor }}>
            {selectedPadName}
          </p>
          <p className="mt-1 max-w-52 truncate text-xs text-zinc-300">
            {selectedPadSample ? selectedPadSample.name : "Default synth voice active"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search "808 kick", "snare", "vinyl clap"...'
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/70"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: "#8cf5ff", boxShadow: "0 0 24px #22d3ee35" }}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {sampleError ? (
        <p className="mt-3 text-sm font-medium text-rose-300">{sampleError}</p>
      ) : null}
      {searchError ? (
        <p className="mt-3 text-sm font-medium text-rose-300">{searchError}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {results.length === 0 && !isSearching && !searchError ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
            Search for a drum hit to swap into the selected pad.
          </p>
        ) : null}

        {results.map((sound) => (
          <div
            key={sound.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 md:flex-row md:items-center"
          >
            <button
              type="button"
              onClick={() => void onAssignSample(sound)}
              disabled={isAssigningSample}
              className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-75"
            >
              <p className="truncate text-sm font-bold text-white">{sound.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-400">
                @{sound.username} · {sound.duration.toFixed(1)}s
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">{sound.license}</p>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => togglePreview(sound)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200"
              >
                {previewingId === sound.id ? "Stop" : "Preview"}
              </button>
              <button
                type="button"
                onClick={() => void onAssignSample(sound)}
                disabled={isAssigningSample}
                className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-black disabled:cursor-not-allowed disabled:opacity-75"
                style={{ backgroundColor: selectedPadColor }}
              >
                {isAssigningSample ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
