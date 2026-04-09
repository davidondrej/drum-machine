"use client";

import type { CSSProperties } from "react";
import { DRUM_SOUNDS } from "@/lib/audioEngine";

interface DrumPadGridProps {
  activePads: Set<number>;
  onTrigger: (index: number) => void;
}

export function DrumPadGrid({ activePads, onTrigger }: DrumPadGridProps) {
  return (
    <div className="grid w-full max-w-xl grid-cols-4 gap-3">
      {DRUM_SOUNDS.map((sound, index) => {
        const isActive = activePads.has(index);

        return (
          <button
            key={sound.name}
            onClick={() => onTrigger(index)}
            className={`relative aspect-square rounded-2xl text-sm font-bold transition-all duration-75 active:scale-95 ${isActive ? "pad-trigger" : ""}`}
            style={
              {
                "--pad-color": sound.color,
                backgroundColor: isActive ? sound.color : `${sound.color}20`,
                color: isActive ? "#040404" : sound.color,
                border: `1px solid ${sound.color}55`,
                boxShadow: isActive
                  ? `0 0 28px ${sound.color}, inset 0 0 24px ${sound.color}66`
                  : `0 0 12px ${sound.color}22, inset 0 0 18px #ffffff05`,
              } as CSSProperties
            }
          >
            <span className="tracking-wide">{sound.name}</span>
          </button>
        );
      })}
    </div>
  );
}
