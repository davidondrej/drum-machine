"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthStatus } from "@/app/drum-machine/AuthStatus";
import { DrumPadGrid } from "@/app/drum-machine/DrumPadGrid";
import { MachineControls } from "@/app/drum-machine/MachineControls";
import { PatternPanels } from "@/app/drum-machine/PatternPanels";
import { SequencerGrid } from "@/app/drum-machine/SequencerGrid";
import { SynthKeyboard } from "@/app/drum-machine/SynthKeyboard";
import { usePatternLibrary } from "@/app/drum-machine/usePatternLibrary";
import { resumeAudio } from "@/lib/audioCore";
import { DRUM_SOUNDS } from "@/lib/audioEngine";
import { createEmptyPattern, NUM_STEPS } from "@/lib/sequencer";
import {
  playSynthStep,
  startSynthNote,
  type SynthWaveform,
} from "@/lib/synthEngine";

const WAVE_COLORS: Record<SynthWaveform, string> = {
  sine: "#00d2ff",
  sawtooth: "#ff4fd8",
  square: "#ffd54a",
};
export default function DrumMachine() {
  const initialPattern = useRef(createEmptyPattern());
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [drumPattern, setDrumPattern] = useState(initialPattern.current.drums);
  const [melodyPattern, setMelodyPattern] = useState(initialPattern.current.melody);
  const [synthWave, setSynthWave] = useState<SynthWaveform>("sawtooth");
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [selectedMelodyStep, setSelectedMelodyStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);

  const drumPatternRef = useRef(drumPattern);
  const melodyPatternRef = useRef(melodyPattern);
  const synthWaveRef = useRef(synthWave);
  const stepRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const previewStopRef = useRef<(() => void) | null>(null);

  const applyLoadedPattern = useCallback(
    ({
      bpm: nextBpm,
      drums,
      melody,
      synthWave: nextWave,
    }: {
      bpm: number;
      drums: boolean[][];
      melody: Array<number | null>;
      synthWave: SynthWaveform;
    }) => {
      setDrumPattern(drums);
      setMelodyPattern(melody);
      setSynthWave(nextWave);
      setBpm(nextBpm);
      setSelectedMelodyStep(0);
    },
    []
  );

  const patternLibrary = usePatternLibrary({
    bpm,
    drumPattern,
    melodyPattern,
    synthWave,
    onLoadPattern: applyLoadedPattern,
  });

  useEffect(() => {
    drumPatternRef.current = drumPattern;
  }, [drumPattern]);

  useEffect(() => {
    melodyPatternRef.current = melodyPattern;
  }, [melodyPattern]);

  useEffect(() => {
    synthWaveRef.current = synthWave;
  }, [synthWave]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
      previewStopRef.current?.();
    };
  }, []);

  const triggerPad = useCallback((index: number) => {
    resumeAudio();
    DRUM_SOUNDS[index].play();

    const existingTimeout = timeoutRefs.current.get(index);
    if (existingTimeout) clearTimeout(existingTimeout);

    setActivePads((prev) => new Set(prev).add(index));
    const timeoutId = setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      timeoutRefs.current.delete(index);
    }, 200);

    timeoutRefs.current.set(index, timeoutId);
  }, []);

  const stopPreviewNote = useCallback(() => {
    previewStopRef.current?.();
    previewStopRef.current = null;
    setActiveMidi(null);
  }, []);

  const playStep = useCallback(
    (stepIndex: number) => {
      drumPatternRef.current.forEach((row, soundIndex) => {
        if (row[stepIndex]) triggerPad(soundIndex);
      });

      const note = melodyPatternRef.current[stepIndex];
      if (note !== null) {
        playSynthStep(note, synthWaveRef.current, (60 / bpm) * 0.5);
      }
    },
    [bpm, triggerPad]
  );

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % NUM_STEPS;
      setCurrentStep(stepRef.current);
      playStep(stepRef.current);
    }, (60 / bpm) * 1000 * 0.5);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [bpm, isPlaying, playStep]);

  const toggleDrumStep = useCallback((soundIndex: number, stepIndex: number) => {
    setDrumPattern((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === soundIndex
          ? row.map((value, index) => (index === stepIndex ? !value : value))
          : row
      )
    );
  }, []);

  const setMelodyStep = useCallback((stepIndex: number, note: number | null) => {
    setMelodyPattern((prev) =>
      prev.map((value, index) => (index === stepIndex ? note : value))
    );
  }, []);

  const handleSynthStart = useCallback(
    (midi: number) => {
      stopPreviewNote();
      const voice = startSynthNote(midi, synthWaveRef.current);
      previewStopRef.current = () => voice.stop();
      setActiveMidi(midi);

      if (!isRecording) return;

      const targetStep = isPlaying ? stepRef.current : selectedMelodyStep;
      setMelodyStep(targetStep, midi);
      if (!isPlaying) setSelectedMelodyStep((targetStep + 1) % NUM_STEPS);
    },
    [isPlaying, isRecording, selectedMelodyStep, setMelodyStep, stopPreviewNote]
  );

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      stopPreviewNote();
      setIsPlaying(false);
      setCurrentStep(-1);
      stepRef.current = 0;
      return;
    }

    resumeAudio();
    stopPreviewNote();
    stepRef.current = 0;
    setCurrentStep(0);
    setIsPlaying(true);
    playStep(0);
  }, [isPlaying, playStep, stopPreviewNote]);

  const clearPattern = useCallback(() => {
    const next = createEmptyPattern();
    setDrumPattern(next.drums);
    setMelodyPattern(next.melody);
    setSelectedMelodyStep(0);
  }, []);

  return (
    <div className="dj-shell relative min-h-screen px-4 py-8 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6">
        <AuthStatus
          authLoading={patternLibrary.authLoading}
          user={patternLibrary.user}
          onSignIn={patternLibrary.handleSignIn}
          onSignOut={patternLibrary.handleSignOut}
        />

        <header className="pt-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
            Neon Performance Rig
          </p>
          <h1 className="bg-gradient-to-r from-rose-500 via-cyan-400 to-lime-300 bg-clip-text text-5xl font-black tracking-[0.3em] text-transparent">
            DRUM MACHINE
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-zinc-400">
            16 drum voices, live synth lead, one tight loop
          </p>
        </header>

        <DrumPadGrid activePads={activePads} onTrigger={triggerPad} />

        <SynthKeyboard
          waveform={synthWave}
          isRecording={isRecording}
          selectedStep={selectedMelodyStep}
          selectedNote={melodyPattern[selectedMelodyStep]}
          activeMidi={activeMidi}
          onWaveformChange={setSynthWave}
          onToggleRecording={() => setIsRecording((prev) => !prev)}
          onClearSelectedStep={() => setMelodyStep(selectedMelodyStep, null)}
          onStartNote={handleSynthStart}
          onStopNote={stopPreviewNote}
        />

        <section className="glass-panel w-full max-w-5xl rounded-[2rem] p-4 md:p-6">
          <MachineControls
            isPlaying={isPlaying}
            bpm={bpm}
            userSignedIn={Boolean(patternLibrary.user)}
            showSave={patternLibrary.showSave}
            showLoad={patternLibrary.showLoad}
            savedCount={patternLibrary.savedPatterns.length}
            flashMessage={patternLibrary.flashMessage}
            onTogglePlayback={togglePlayback}
            onBpmChange={setBpm}
            onClear={clearPattern}
            onToggleSave={patternLibrary.toggleSavePanel}
            onToggleLoad={patternLibrary.toggleLoadPanel}
          />

          <PatternPanels
            showSave={patternLibrary.showSave}
            showLoad={patternLibrary.showLoad}
            userSignedIn={Boolean(patternLibrary.user)}
            saveName={patternLibrary.saveName}
            savedPatterns={patternLibrary.savedPatterns}
            saveInputRef={patternLibrary.saveInputRef}
            onSaveNameChange={patternLibrary.setSaveName}
            onSave={patternLibrary.handleSave}
            onCloseSave={patternLibrary.closeSavePanel}
            onLoad={patternLibrary.handleLoad}
            onOverwrite={patternLibrary.handleOverwrite}
            onDelete={patternLibrary.handleDelete}
          />

          <SequencerGrid
            drumPattern={drumPattern}
            melodyPattern={melodyPattern}
            currentStep={currentStep}
            isPlaying={isPlaying}
            selectedMelodyStep={selectedMelodyStep}
            melodyColor={WAVE_COLORS[synthWave]}
            onToggleDrumStep={toggleDrumStep}
            onSelectMelodyStep={setSelectedMelodyStep}
          />
        </section>

        <p className="text-center text-xs uppercase tracking-[0.25em] text-zinc-600">
          Tap pads for drums. Arm REC to punch notes into the synth lane while the loop runs.
        </p>
      </div>
    </div>
  );
}
