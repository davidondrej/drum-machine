"use client";

import type { CSSProperties } from "react";
import type { SynthWaveform } from "@/lib/synthEngine";
import { KEYBOARD_KEYS, midiToLabel } from "@/lib/music";

const WHITE_KEY_WIDTH = 54;
const BLACK_KEY_WIDTH = 34;
const WAVE_OPTIONS: Array<{ value: SynthWaveform; label: string; color: string }> =
  [
    { value: "sine", label: "Sine", color: "#00d2ff" },
    { value: "sawtooth", label: "Saw", color: "#ff4fd8" },
    { value: "square", label: "Square", color: "#ffd54a" },
  ];

interface SynthKeyboardProps {
  waveform: SynthWaveform;
  isRecording: boolean;
  selectedStep: number;
  selectedNote: number | null;
  activeMidi: number | null;
  onWaveformChange: (waveform: SynthWaveform) => void;
  onToggleRecording: () => void;
  onClearSelectedStep: () => void;
  onStartNote: (midi: number) => void;
  onStopNote: () => void;
}

export function SynthKeyboard({
  waveform,
  isRecording,
  selectedStep,
  selectedNote,
  activeMidi,
  onWaveformChange,
  onToggleRecording,
  onClearSelectedStep,
  onStartNote,
  onStopNote,
}: SynthKeyboardProps) {
  const whiteKeyCount = KEYBOARD_KEYS.filter((key) => !key.isSharp).length;
  const keyboardWidth = whiteKeyCount * WHITE_KEY_WIDTH;
  const waveformColor =
    WAVE_OPTIONS.find((option) => option.value === waveform)?.color ?? "#ff4fd8";

  return (
    <section className="glass-panel w-full max-w-5xl rounded-[2rem] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Melody Synth
          </div>
          <div className="mt-1 text-sm text-zinc-300">
            Step {selectedStep + 1} ·{" "}
            <span style={{ color: waveformColor }}>
              {selectedNote === null ? "Rest" : midiToLabel(selectedNote)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WAVE_OPTIONS.map((option) => {
            const active = option.value === waveform;

            return (
              <button
                key={option.value}
                onClick={() => onWaveformChange(option.value)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] transition-all"
                style={{
                  backgroundColor: active ? option.color : `${option.color}18`,
                  color: active ? "#050505" : option.color,
                  border: `1px solid ${option.color}55`,
                  boxShadow: active ? `0 0 18px ${option.color}55` : "none",
                }}
              >
                {option.label}
              </button>
            );
          })}

          <button
            onClick={onToggleRecording}
            className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] transition-all"
            style={{
              backgroundColor: isRecording ? "#ff335f" : "#2b1118",
              color: isRecording ? "#050505" : "#ff7a98",
              border: "1px solid #ff4c6f55",
              boxShadow: isRecording ? "0 0 18px #ff335f55" : "none",
            }}
          >
            {isRecording ? "Rec Armed" : "Rec Off"}
          </button>

          <button
            onClick={onClearSelectedStep}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
          >
            Clear Step
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span>Click and hold keys for live preview.</span>
        <span>With REC armed, notes write into the selected or current step.</span>
      </div>

      <div className="keyboard-shell overflow-x-auto rounded-[1.75rem] p-3">
        <div
          className="relative mx-auto h-[224px] min-w-max"
          style={{ width: keyboardWidth }}
        >
          {KEYBOARD_KEYS.filter((key) => !key.isSharp).map((key) => {
            const isActive = activeMidi === key.midi;

            return (
              <button
                key={key.midi}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  onStartNote(key.midi);
                }}
                onPointerUp={onStopNote}
                onPointerCancel={onStopNote}
                className={`white-key ${isActive ? "key-active" : ""}`}
                style={
                  {
                    left: key.whiteIndex * WHITE_KEY_WIDTH,
                    width: WHITE_KEY_WIDTH,
                    "--key-accent": waveformColor,
                  } as CSSProperties
                }
              >
                <span className="pointer-events-none">{key.label}</span>
              </button>
            );
          })}

          {KEYBOARD_KEYS.filter((key) => key.isSharp).map((key) => {
            const isActive = activeMidi === key.midi;

            return (
              <button
                key={key.midi}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  onStartNote(key.midi);
                }}
                onPointerUp={onStopNote}
                onPointerCancel={onStopNote}
                className={`black-key ${isActive ? "key-active" : ""}`}
                style={
                  {
                    left: key.whiteIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
                    width: BLACK_KEY_WIDTH,
                    "--key-accent": waveformColor,
                  } as CSSProperties
                }
              >
                <span className="pointer-events-none">{key.note}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
