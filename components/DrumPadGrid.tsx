"use client";

import type { CSSProperties } from "react";
import type { DrumSampleAssignment } from "@/lib/freesound";
import { DRUM_SOUNDS } from "@/lib/audioEngine";

interface DrumPadGridProps {
  activePads: Set<number>;
  selectedPad: number;
  sampleAssignments: Array<DrumSampleAssignment | null>;
  onPadClick: (index: number) => void;
}

export function DrumPadGrid({
  activePads,
  selectedPad,
  sampleAssignments,
  onPadClick,
}: DrumPadGridProps) {
  return (
    <div className="grid w-full max-w-xl grid-cols-4 gap-3">
      {DRUM_SOUNDS.map((sound, index) => {
        const isActive = activePads.has(index);
        const isSelected = selectedPad === index;
        const sample = sampleAssignments[index];

        return (
          <button
            key={sound.name}
            onClick={() => onPadClick(index)}
            className={`relative aspect-square rounded-2xl px-2 py-3 text-sm font-bold transition-all duration-75 active:scale-95 ${isActive ? "pad-trigger" : ""}`}
            style={
              {
                "--pad-color": sound.color,
                backgroundColor: isActive ? sound.color : `${sound.color}20`,
                color: isActive ? "#040404" : sound.color,
                border: `1px solid ${isSelected ? sound.color : `${sound.color}55`}`,
                boxShadow: isActive
                  ? `0 0 28px ${sound.color}, inset 0 0 24px ${sound.color}66`
                  : isSelected
                    ? `0 0 18px ${sound.color}38, inset 0 0 0 1px ${sound.color}`
                    : `0 0 12px ${sound.color}22, inset 0 0 18px #ffffff05`,
              } as CSSProperties
            }
          >
            {isSelected ? (
              <span className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                Selected
              </span>
            ) : null}
            <span className="block tracking-wide">{sound.name}</span>
            <span className="mt-2 block truncate text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
              {sample ? sample.name : "Default voice"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
