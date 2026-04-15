"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePatternLibrary } from "@/app/drum-machine/usePatternLibrary";
import { loadAudioBuffer, playAudioBuffer, resumeAudio } from "@/lib/audioCore";
import { DRUM_SOUNDS } from "@/lib/audioEngine";
import {
  createDrumSampleAssignment,
  type DrumSampleAssignment,
  type FreesoundSound,
} from "@/lib/freesound";
import { createEmptyPattern, NUM_STEPS } from "@/lib/sequencer";
import {
  playSynthStep,
  startSynthNote,
  type SynthWaveform,
} from "@/lib/synthEngine";

export function useDrumMachineState() {
  const initialPattern = useRef(createEmptyPattern());
  const emptyAssignments = useRef<Array<DrumSampleAssignment | null>>(
    Array.from({ length: DRUM_SOUNDS.length }, () => null)
  );
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [drumPattern, setDrumPattern] = useState(initialPattern.current.drums);
  const [melodyPattern, setMelodyPattern] = useState(initialPattern.current.melody);
  const [synthWave, setSynthWave] = useState<SynthWaveform>("sawtooth");
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [selectedPad, setSelectedPad] = useState(0);
  const [sampleAssignments, setSampleAssignments] = useState(emptyAssignments.current);
  const [isAssigningSample, setIsAssigningSample] = useState(false);
  const [sampleError, setSampleError] = useState("");
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
  const sampleBuffersRef = useRef<Map<number, AudioBuffer>>(new Map());

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
    const sampleBuffer = sampleBuffersRef.current.get(index);
    if (sampleBuffer) {
      playAudioBuffer(sampleBuffer);
    } else {
      DRUM_SOUNDS[index].playDefault();
    }

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

  const triggerSelectedPad = useCallback(
    (index: number) => {
      setSelectedPad(index);
      triggerPad(index);
    },
    [triggerPad]
  );

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

  const assignSampleToPad = useCallback(async (sound: FreesoundSound) => {
    const targetPad = selectedPad;

    setIsAssigningSample(true);
    setSampleError("");

    try {
      resumeAudio();
      const buffer = await loadAudioBuffer(sound.previewUrl);

      sampleBuffersRef.current.set(targetPad, buffer);
      setSampleAssignments((prev) =>
        prev.map((assignment, index) =>
          index === targetPad ? createDrumSampleAssignment(sound) : assignment
        )
      );
    } catch {
      setSampleError("Sample loading failed for the selected pad.");
    } finally {
      setIsAssigningSample(false);
    }
  }, [selectedPad]);

  return {
    activeMidi,
    activePads,
    assignSampleToPad,
    bpm,
    clearPattern,
    sampleAssignments,
    sampleError,
    currentStep,
    drumPattern,
    handleSynthStart,
    isAssigningSample,
    isPlaying,
    isRecording,
    melodyPattern,
    patternLibrary,
    selectedPad,
    selectedMelodyStep,
    setBpm,
    setSelectedPad,
    setSelectedMelodyStep,
    setSynthWave,
    stopPreviewNote,
    synthWave,
    toggleDrumStep,
    togglePlayback,
    toggleRecording: () => setIsRecording((prev) => !prev),
    clearSelectedMelodyStep: () => setMelodyStep(selectedMelodyStep, null),
    triggerPad,
    triggerSelectedPad,
  };
}
