"use client";

import type { RefObject } from "react";
import type { SavedPatternRow } from "@/app/drum-machine/usePatternLibrary";
import { countPatternEvents } from "@/lib/sequencer";

interface PatternPanelsProps {
  showSave: boolean;
  showLoad: boolean;
  userSignedIn: boolean;
  saveName: string;
  savedPatterns: SavedPatternRow[];
  saveInputRef: RefObject<HTMLInputElement | null>;
  onSaveNameChange: (value: string) => void;
  onSave: () => void;
  onCloseSave: () => void;
  onLoad: (pattern: SavedPatternRow) => void;
  onOverwrite: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function PatternPanels({
  showSave,
  showLoad,
  userSignedIn,
  saveName,
  savedPatterns,
  saveInputRef,
  onSaveNameChange,
  onSave,
  onCloseSave,
  onLoad,
  onOverwrite,
  onDelete,
}: PatternPanelsProps) {
  if (!userSignedIn || (!showSave && !showLoad)) {
    return null;
  }

  return (
    <>
      {showSave ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-950/20 p-3">
          <span className="shrink-0 text-sm text-zinc-400">Name</span>
          <input
            ref={saveInputRef}
            type="text"
            value={saveName}
            onChange={(event) => onSaveNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSave();
              if (event.key === "Escape") onCloseSave();
            }}
            placeholder="Midnight circuit"
            maxLength={40}
            className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <button
            onClick={onSave}
            disabled={!saveName.trim()}
            className="rounded-xl px-4 py-2 text-sm font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ backgroundColor: "#d946ef" }}
          >
            SAVE
          </button>
          <button
            onClick={onCloseSave}
            className="px-1 text-lg leading-none text-zinc-500 transition-colors hover:text-white"
            aria-label="Close save panel"
          >
            &times;
          </button>
        </div>
      ) : null}

      {showLoad ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-cyan-500/20">
          {savedPatterns.length === 0 ? (
            <div className="bg-cyan-950/10 p-4 text-center text-sm text-zinc-500">
              No saved patterns yet. Build a groove and save it.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {savedPatterns.map((pattern, index) => {
                const date = new Date(pattern.created_at);
                const dateLabel = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const timeLabel = date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={pattern.id}
                    className="flex items-center gap-3 px-3 py-2"
                    style={{
                      backgroundColor: index % 2 === 0 ? "#121722" : "#0f141d",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {pattern.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {pattern.bpm} BPM · {countPatternEvents(pattern.pattern)} events
                        {" · "}
                        {dateLabel} {timeLabel}
                      </div>
                    </div>
                    <button
                      onClick={() => onLoad(pattern)}
                      className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300"
                    >
                      LOAD
                    </button>
                    <button
                      onClick={() => onOverwrite(pattern.id, pattern.name)}
                      className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300"
                    >
                      UPDATE
                    </button>
                    <button
                      onClick={() => onDelete(pattern.id, pattern.name)}
                      className="px-1 text-lg leading-none text-zinc-600 transition-colors hover:text-rose-400"
                      aria-label={`Delete ${pattern.name}`}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
