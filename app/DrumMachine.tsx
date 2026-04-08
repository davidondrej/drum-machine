"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SOUNDS, resumeAudio } from "@/lib/audioEngine";

const NUM_SOUNDS = 16;
const NUM_STEPS = 8;

function createEmptyPattern(): boolean[][] {
  return Array.from({ length: NUM_SOUNDS }, () => Array(NUM_STEPS).fill(false));
}

export default function DrumMachine() {
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<boolean[][]>(createEmptyPattern);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);

  const patternRef = useRef(pattern);
  const stepRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const triggerPad = useCallback((index: number) => {
    resumeAudio();
    SOUNDS[index].play();

    // Clear existing timeout for this pad
    const existing = timeoutRefs.current.get(index);
    if (existing) clearTimeout(existing);

    setActivePads((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    const tid = setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      timeoutRefs.current.delete(index);
    }, 250);

    timeoutRefs.current.set(index, tid);
  }, []);

  const toggleStep = useCallback((soundIdx: number, stepIdx: number) => {
    setPattern((prev) => {
      const next = prev.map((row) => [...row]);
      next[soundIdx][stepIdx] = !next[soundIdx][stepIdx];
      return next;
    });
  }, []);

  const startPlayback = useCallback(() => {
    resumeAudio();
    stepRef.current = 0;
    setCurrentStep(0);
    setIsPlaying(true);

    // Play first step immediately
    const p = patternRef.current;
    for (let i = 0; i < NUM_SOUNDS; i++) {
      if (p[i][0]) triggerPad(i);
    }

    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % NUM_STEPS;
      const step = stepRef.current;
      setCurrentStep(step);

      const pat = patternRef.current;
      for (let i = 0; i < NUM_SOUNDS; i++) {
        if (pat[i][step]) triggerPad(i);
      }
    }, (60 / bpm) * 1000 * 0.5); // 8th notes
  }, [bpm, triggerPad]);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(-1);
    stepRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutRefs.current.forEach((tid) => clearTimeout(tid));
    };
  }, []);

  // Restart interval when BPM changes during playback
  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        stepRef.current = (stepRef.current + 1) % NUM_STEPS;
        const step = stepRef.current;
        setCurrentStep(step);
        const pat = patternRef.current;
        for (let i = 0; i < NUM_SOUNDS; i++) {
          if (pat[i][step]) triggerPad(i);
        }
      }, (60 / bpm) * 1000 * 0.5);
    }
  }, [bpm, isPlaying, triggerPad]);

  const clearPattern = useCallback(() => {
    setPattern(createEmptyPattern());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 select-none">
      {/* Title */}
      <h1
        className="text-4xl font-bold tracking-wider mb-2"
        style={{
          background: "linear-gradient(90deg, #ff0055, #00ccff, #00ff88, #ffcc00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        DRUM MACHINE
      </h1>
      <p className="text-gray-500 text-sm mb-8 tracking-widest uppercase">
        Web Audio Synthesizer
      </p>

      {/* 4x4 Pad Grid */}
      <div className="grid grid-cols-4 gap-3 mb-10 w-full max-w-lg">
        {SOUNDS.map((sound, idx) => {
          const isActive = activePads.has(idx);
          return (
            <button
              key={idx}
              onClick={() => triggerPad(idx)}
              className={`
                relative aspect-square rounded-xl font-bold text-sm
                flex items-center justify-center cursor-pointer
                transition-all duration-75 active:scale-95
                ${isActive ? "pad-trigger" : ""}
              `}
              style={
                {
                  "--pad-color": sound.color,
                  backgroundColor: isActive
                    ? sound.color
                    : `${sound.color}22`,
                  color: isActive ? "#000" : sound.color,
                  border: `2px solid ${sound.color}55`,
                  boxShadow: isActive
                    ? `0 0 20px ${sound.color}, 0 0 40px ${sound.color}80`
                    : `0 0 8px ${sound.color}30`,
                } as React.CSSProperties
              }
            >
              {sound.name}
            </button>
          );
        })}
      </div>

      {/* Step Sequencer */}
      <div className="w-full max-w-4xl rounded-2xl p-5" style={{ backgroundColor: "#12121a" }}>
        {/* Transport Controls */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={isPlaying ? stopPlayback : startPlayback}
            className="px-6 py-2.5 rounded-lg font-bold text-sm tracking-wider transition-all cursor-pointer"
            style={{
              backgroundColor: isPlaying ? "#ff0055" : "#00ff88",
              color: "#000",
              boxShadow: isPlaying
                ? "0 0 15px #ff005580"
                : "0 0 15px #00ff8880",
            }}
          >
            {isPlaying ? "STOP" : "PLAY"}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm font-medium">BPM</span>
            <input
              type="range"
              min={60}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-28 accent-[#00ccff]"
            />
            <span
              className="text-sm font-bold w-8 text-right"
              style={{ color: "#00ccff" }}
            >
              {bpm}
            </span>
          </div>

          <button
            onClick={clearPattern}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer
              border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          >
            CLEAR
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex mb-1">
          <div className="w-20 shrink-0" />
          <div className="flex-1 grid grid-cols-8 gap-1">
            {Array.from({ length: NUM_STEPS }, (_, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium py-1 rounded"
                style={{
                  color: currentStep === i ? "#fff" : "#555",
                  backgroundColor:
                    currentStep === i ? "#ffffff15" : "transparent",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="space-y-1">
          {SOUNDS.map((sound, soundIdx) => (
            <div key={soundIdx} className="flex items-center gap-1">
              {/* Label */}
              <div
                className="w-20 shrink-0 text-xs font-medium truncate pr-2 text-right"
                style={{ color: `${sound.color}cc` }}
              >
                {sound.name}
              </div>

              {/* Steps */}
              <div className="flex-1 grid grid-cols-8 gap-1">
                {Array.from({ length: NUM_STEPS }, (_, stepIdx) => {
                  const isOn = pattern[soundIdx][stepIdx];
                  const isCurrent = currentStep === stepIdx && isPlaying;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(soundIdx, stepIdx)}
                      className={`
                        h-7 rounded cursor-pointer transition-all duration-75
                        ${isCurrent ? "beat-active" : ""}
                      `}
                      style={{
                        backgroundColor: isOn
                          ? isCurrent
                            ? sound.color
                            : `${sound.color}99`
                          : isCurrent
                            ? "#ffffff15"
                            : "#1a1a2e",
                        border: `1px solid ${
                          isOn ? `${sound.color}66` : "#2a2a3e"
                        }`,
                        boxShadow: isOn && isCurrent
                          ? `0 0 8px ${sound.color}80`
                          : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-gray-600 text-xs mt-6">
        Click pads to play sounds. Toggle steps in the sequencer and hit PLAY.
      </p>
    </div>
  );
}
