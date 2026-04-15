"use client";

import { DRUM_SOUNDS } from "@/lib/audioEngine";
import { midiToLabel } from "@/lib/music";
import { NUM_STEPS } from "@/lib/sequencer";

interface SequencerGridProps {
  drumPattern: boolean[][];
  melodyPattern: Array<number | null>;
  currentStep: number;
  isPlaying: boolean;
  selectedMelodyStep: number;
  melodyColor: string;
  onToggleDrumStep: (soundIndex: number, stepIndex: number) => void;
  onSelectMelodyStep: (stepIndex: number) => void;
}

export function SequencerGrid({
  drumPattern,
  melodyPattern,
  currentStep,
  isPlaying,
  selectedMelodyStep,
  melodyColor,
  onToggleDrumStep,
  onSelectMelodyStep,
}: SequencerGridProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <div className="w-20 shrink-0" />
        <div className="grid flex-1 grid-cols-8 gap-1">
          {Array.from({ length: NUM_STEPS }, (_, index) => (
            <div
              key={index}
              className="rounded-lg py-1 text-center text-xs font-semibold"
              style={{
                color: currentStep === index ? "#ffffff" : "#5f6473",
                backgroundColor:
                  currentStep === index ? "#ffffff12" : "transparent",
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div
          className="w-20 shrink-0 pr-2 text-right text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: `${melodyColor}dd` }}
        >
          Lead
        </div>
        <div className="grid flex-1 grid-cols-8 gap-1">
          {melodyPattern.map((note, stepIndex) => {
            const isCurrent = currentStep === stepIndex && isPlaying;
            const isSelected = selectedMelodyStep === stepIndex;

            return (
              <button
                key={stepIndex}
                onClick={() => onSelectMelodyStep(stepIndex)}
                className={`h-12 rounded-xl px-1 text-xs font-semibold transition-all ${isCurrent ? "beat-active" : ""}`}
                style={{
                  color: note === null ? "#778090" : melodyColor,
                  backgroundColor:
                    note === null
                      ? isCurrent
                        ? "#ffffff14"
                        : "#131928"
                      : `${melodyColor}${isCurrent ? "55" : "30"}`,
                  border: `1px solid ${
                    isSelected ? melodyColor : note === null ? "#253045" : `${melodyColor}55`
                  }`,
                  boxShadow:
                    isSelected || (isCurrent && note !== null)
                      ? `0 0 18px ${melodyColor}35`
                      : "none",
                }}
              >
                {note === null ? "REST" : midiToLabel(note)}
              </button>
            );
          })}
        </div>
      </div>

      {DRUM_SOUNDS.map((sound, soundIndex) => (
        <div key={sound.name} className="flex items-center gap-1">
          <div
            className="w-20 shrink-0 truncate pr-2 text-right text-xs font-medium"
            style={{ color: `${sound.color}cc` }}
          >
            {sound.name}
          </div>
          <div className="grid flex-1 grid-cols-8 gap-1">
            {Array.from({ length: NUM_STEPS }, (_, stepIndex) => {
              const isOn = drumPattern[soundIndex][stepIndex];
              const isCurrent = currentStep === stepIndex && isPlaying;

              return (
                <button
                  key={stepIndex}
                  onClick={() => onToggleDrumStep(soundIndex, stepIndex)}
                  className={`h-7 rounded-lg transition-all ${isCurrent ? "beat-active" : ""}`}
                  style={{
                    backgroundColor: isOn
                      ? isCurrent
                        ? sound.color
                        : `${sound.color}88`
                      : isCurrent
                        ? "#ffffff14"
                        : "#151b29",
                    border: `1px solid ${isOn ? `${sound.color}55` : "#273044"}`,
                    boxShadow:
                      isOn && isCurrent ? `0 0 10px ${sound.color}80` : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
