"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SOUNDS, resumeAudio } from "@/lib/audioEngine";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const NUM_SOUNDS = 16;
const NUM_STEPS = 8;

interface SavedPattern {
  id: string;
  name: string;
  pattern: boolean[][];
  bpm: number;
  created_at: string;
}

function createEmptyPattern(): boolean[][] {
  return Array.from({ length: NUM_SOUNDS }, () => Array(NUM_STEPS).fill(false));
}

export default function DrumMachine() {
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<boolean[][]>(createEmptyPattern);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Save/Load state
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [flashMessage, setFlashMessage] = useState("");

  const patternRef = useRef(pattern);
  const stepRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  // Auth: subscribe to session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch patterns from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setSavedPatterns([]);
      return;
    }

    async function fetchPatterns() {
      const { data } = await supabase
        .from("patterns")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setSavedPatterns(data as SavedPattern[]);
    }

    fetchPatterns();
  }, [user]);

  const triggerPad = useCallback((index: number) => {
    resumeAudio();
    SOUNDS[index].play();

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
    }, (60 / bpm) * 1000 * 0.5);
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

  // Auto-focus save input when it appears
  useEffect(() => {
    if (showSave && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSave]);

  const flash = useCallback((msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(""), 2000);
  }, []);

  // Auth handlers
  const handleSignIn = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSavedPatterns([]);
    setShowSave(false);
    setShowLoad(false);
  }, []);

  // Save pattern to Supabase
  const handleSave = useCallback(async () => {
    const name = saveName.trim();
    if (!name || !user) return;

    const { data, error } = await supabase
      .from("patterns")
      .insert({
        user_id: user.id,
        name,
        pattern: pattern.map((row) => [...row]),
        bpm,
      })
      .select()
      .single();

    if (error) {
      flash("Save failed");
      return;
    }

    setSavedPatterns((prev) => [data as SavedPattern, ...prev]);
    setSaveName("");
    setShowSave(false);
    flash(`Saved "${name}"`);
  }, [saveName, pattern, bpm, user, flash]);

  const handleLoad = useCallback(
    (saved: SavedPattern) => {
      setPattern(saved.pattern.map((row) => [...row]));
      setBpm(saved.bpm);
      setShowLoad(false);
      flash(`Loaded "${saved.name}"`);
    },
    [flash]
  );

  // Delete pattern from Supabase
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const { error } = await supabase
        .from("patterns")
        .delete()
        .eq("id", id);

      if (error) {
        flash("Delete failed");
        return;
      }

      setSavedPatterns((prev) => prev.filter((p) => p.id !== id));
      flash(`Deleted "${name}"`);
    },
    [flash]
  );

  // Overwrite pattern in Supabase
  const handleOverwrite = useCallback(
    async (id: string, name: string) => {
      const { error } = await supabase
        .from("patterns")
        .update({
          pattern: pattern.map((row) => [...row]),
          bpm,
        })
        .eq("id", id);

      if (error) {
        flash("Update failed");
        return;
      }

      setSavedPatterns((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, pattern: pattern.map((row) => [...row]), bpm }
            : p
        )
      );
      flash(`Updated "${name}"`);
    },
    [pattern, bpm, flash]
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 select-none">
      {/* Auth — top right */}
      {!authLoading && (
        <div className="absolute top-4 right-4 z-10">
          {user ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#ffffff0a", border: "1px solid #ffffff12" }}>
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-xs text-gray-400">
                {user.user_metadata.user_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-600 hover:text-white cursor-pointer transition-colors ml-0.5"
              >
                &times;
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:bg-white/15 hover:text-white hover:border-white/30"
              style={{ backgroundColor: "#ffffff08", border: "1px solid #ffffff15", color: "#aaa" }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Sign in
            </button>
          )}
        </div>
      )}

      {/* Title */}
      <h1
        className="text-4xl font-bold tracking-wider mb-2"
        style={{
          background:
            "linear-gradient(90deg, #ff0055, #00ccff, #00ff88, #ffcc00)",
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
      <div
        className="w-full max-w-4xl rounded-2xl p-5"
        style={{ backgroundColor: "#12121a" }}
      >
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

          {/* Save/Load buttons — only when signed in */}
          {user && (
            <>
              <div className="h-5 w-px bg-gray-700 mx-1" />

              <button
                onClick={() => {
                  setShowSave(!showSave);
                  setShowLoad(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: showSave ? "#cc00ff" : "transparent",
                  color: showSave ? "#000" : "#cc00ff",
                  border: "1px solid #cc00ff66",
                  boxShadow: showSave ? "0 0 12px #cc00ff60" : "none",
                }}
              >
                SAVE
              </button>

              <button
                onClick={() => {
                  setShowLoad(!showLoad);
                  setShowSave(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: showLoad ? "#00ccff" : "transparent",
                  color: showLoad ? "#000" : "#00ccff",
                  border: "1px solid #00ccff66",
                  boxShadow: showLoad ? "0 0 12px #00ccff60" : "none",
                }}
              >
                LOAD
                {savedPatterns.length > 0 && (
                  <span
                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: showLoad ? "#00000033" : "#00ccff22",
                      color: showLoad ? "#000" : "#00ccff",
                    }}
                  >
                    {savedPatterns.length}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Flash message */}
          {flashMessage && (
            <span
              className="text-sm font-medium ml-2 animate-pulse"
              style={{ color: "#00ff88" }}
            >
              {flashMessage}
            </span>
          )}
        </div>

        {/* Save Panel */}
        {showSave && user && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: "#1a1a2e",
              border: "1px solid #cc00ff33",
            }}
          >
            <span className="text-sm text-gray-400 shrink-0">Name:</span>
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setShowSave(false);
              }}
              placeholder="My awesome beat..."
              maxLength={40}
              className="flex-1 bg-transparent text-white text-sm px-3 py-1.5 rounded outline-none"
              style={{ border: "1px solid #333", caretColor: "#cc00ff" }}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="px-4 py-1.5 rounded text-sm font-bold cursor-pointer transition-opacity"
              style={{
                backgroundColor: saveName.trim() ? "#cc00ff" : "#333",
                color: saveName.trim() ? "#000" : "#666",
                opacity: saveName.trim() ? 1 : 0.5,
              }}
            >
              SAVE
            </button>
            <button
              onClick={() => setShowSave(false)}
              className="text-gray-500 hover:text-white cursor-pointer text-lg leading-none px-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Load Panel */}
        {showLoad && user && (
          <div
            className="mb-4 rounded-lg overflow-hidden"
            style={{ border: "1px solid #00ccff33" }}
          >
            {savedPatterns.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No saved patterns yet. Create a beat and hit SAVE.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {savedPatterns.map((saved, idx) => {
                  const date = new Date(saved.created_at);
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const activeSteps = saved.pattern
                    .flat()
                    .filter(Boolean).length;

                  return (
                    <div
                      key={saved.id}
                      className="flex items-center gap-3 px-3 py-2 transition-colors"
                      style={{
                        backgroundColor:
                          idx % 2 === 0 ? "#1a1a2e" : "#15151f",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {saved.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {saved.bpm} BPM &middot; {activeSteps} steps &middot;{" "}
                          {dateStr} {timeStr}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoad(saved)}
                        className="px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shrink-0"
                        style={{
                          backgroundColor: "#00ccff22",
                          color: "#00ccff",
                          border: "1px solid #00ccff44",
                        }}
                      >
                        LOAD
                      </button>
                      <button
                        onClick={() => handleOverwrite(saved.id, saved.name)}
                        className="px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shrink-0"
                        style={{
                          backgroundColor: "#ffcc0015",
                          color: "#ffcc00",
                          border: "1px solid #ffcc0033",
                        }}
                        title="Overwrite with current pattern"
                      >
                        UPDATE
                      </button>
                      <button
                        onClick={() => handleDelete(saved.id, saved.name)}
                        className="text-gray-600 hover:text-red-400 cursor-pointer text-lg leading-none px-1 shrink-0 transition-colors"
                        title="Delete pattern"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                        boxShadow:
                          isOn && isCurrent
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
