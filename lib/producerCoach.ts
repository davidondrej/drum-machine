import { DRUM_SOUNDS } from "@/lib/audioEngine";
import { midiToLabel } from "@/lib/music";
import type { SynthWaveform } from "@/lib/synthEngine";

/**
 * Snapshot-building utilities for the AI coach.
 * The snapshot intentionally contains only visible sequencer state so the model cannot invent audio details.
 */
export interface DrumLaneSnapshot {
  name: string;
  activeSteps: number[];
  hitCount: number;
}

export interface MachineSnapshot {
  bpm: number;
  synthWave: SynthWaveform;
  melodySteps: Array<number | null>;
  melodyLabels: string[];
  drums: DrumLaneSnapshot[];
  stats: {
    totalDrumHits: number;
    totalMelodyHits: number;
    uniqueDrumLanes: number;
    activeSteps: number;
    offbeatDrumHits: number;
    kickPresent: boolean;
    snarePresent: boolean;
    hiHatPresent: boolean;
    openHatPresent: boolean;
    clapPresent: boolean;
    melodyRange: number;
    repeatedFirstHalf: boolean;
  };
  promptSummary: string;
}

export interface CoachFeedback {
  summary: string;
  missingElements: string[];
  tooSafe: string[];
  specificMoves: string[];
  producerNote: string;
}

export const EMPTY_COACH_FEEDBACK: CoachFeedback = {
  summary: "Build a loop and the coach will break down what is missing.",
  missingElements: [],
  tooSafe: [],
  specificMoves: [],
  producerNote: "The coach only reads the current pattern, BPM, and synth settings.",
};

function countOffbeatHits(drums: boolean[][]) {
  return drums.reduce(
    (sum, row) => sum + row.filter((isOn, stepIndex) => isOn && stepIndex % 2 === 1).length,
    0
  );
}

function hasLaneHit(drums: boolean[][], laneIndex: number) {
  return drums[laneIndex]?.some(Boolean) ?? false;
}

function getMelodyRange(melody: Array<number | null>) {
  const notes = melody.filter((note): note is number => note !== null);
  if (notes.length < 2) {
    return 0;
  }

  return Math.max(...notes) - Math.min(...notes);
}

function isRepeatedFirstHalf(drums: boolean[][], melody: Array<number | null>) {
  const drumRepeats = drums.every((row) =>
    row.slice(0, 4).every((value, index) => value === row[index + 4])
  );
  const melodyRepeats = melody.slice(0, 4).every((value, index) => value === melody[index + 4]);
  return drumRepeats && melodyRepeats;
}

// Keep the prompt payload compact and deterministic so the route can safely forward it to the LLM.
export function buildMachineSnapshot({
  bpm,
  drumPattern,
  melodyPattern,
  synthWave,
}: {
  bpm: number;
  drumPattern: boolean[][];
  melodyPattern: Array<number | null>;
  synthWave: SynthWaveform;
}): MachineSnapshot {
  const drums = DRUM_SOUNDS.map((sound, soundIndex) => {
    const activeSteps = drumPattern[soundIndex]
      .map((isOn, stepIndex) => (isOn ? stepIndex + 1 : null))
      .filter((step): step is number => step !== null);

    return {
      name: sound.name,
      activeSteps,
      hitCount: activeSteps.length,
    };
  });

  const melodyLabels = melodyPattern.map((note) => (note === null ? "REST" : midiToLabel(note)));
  const totalDrumHits = drums.reduce((sum, lane) => sum + lane.hitCount, 0);
  const totalMelodyHits = melodyPattern.filter((note) => note !== null).length;
  const uniqueDrumLanes = drums.filter((lane) => lane.hitCount > 0).length;
  const activeSteps = new Set(
    drums.flatMap((lane) => lane.activeSteps).concat(
      melodyPattern.flatMap((note, index) => (note === null ? [] : [index + 1]))
    )
  ).size;

  const stats = {
    totalDrumHits,
    totalMelodyHits,
    uniqueDrumLanes,
    activeSteps,
    offbeatDrumHits: countOffbeatHits(drumPattern),
    kickPresent: hasLaneHit(drumPattern, 0),
    snarePresent: hasLaneHit(drumPattern, 1),
    hiHatPresent: hasLaneHit(drumPattern, 2),
    openHatPresent: hasLaneHit(drumPattern, 3),
    clapPresent: hasLaneHit(drumPattern, 4),
    melodyRange: getMelodyRange(melodyPattern),
    repeatedFirstHalf: isRepeatedFirstHalf(drumPattern, melodyPattern),
  };

  const activeDrumSummary = drums
    .filter((lane) => lane.hitCount > 0)
    .map((lane) => `${lane.name}(${lane.activeSteps.join(",")})`)
    .join(" | ");

  const melodySummary = melodyLabels
    .map((label, index) => `${index + 1}:${label}`)
    .join(" | ");

  return {
    bpm,
    synthWave,
    melodySteps: [...melodyPattern],
    melodyLabels,
    drums,
    stats,
    promptSummary: [
      `BPM ${bpm}`,
      `Wave ${synthWave}`,
      `Drums ${activeDrumSummary || "none"}`,
      `Melody ${melodySummary}`,
      `Stats drumHits=${totalDrumHits} melodyHits=${totalMelodyHits} lanes=${uniqueDrumLanes} offbeats=${stats.offbeatDrumHits} repeatedHalf=${stats.repeatedFirstHalf}`,
    ].join(" · "),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function normalizeCoachFeedback(value: unknown): CoachFeedback {
  if (!value || typeof value !== "object") {
    return EMPTY_COACH_FEEDBACK;
  }

  const source = value as Partial<CoachFeedback>;

  return {
    summary: typeof source.summary === "string" ? source.summary : EMPTY_COACH_FEEDBACK.summary,
    missingElements: isStringArray(source.missingElements) ? source.missingElements.slice(0, 4) : [],
    tooSafe: isStringArray(source.tooSafe) ? source.tooSafe.slice(0, 4) : [],
    specificMoves: isStringArray(source.specificMoves) ? source.specificMoves.slice(0, 5) : [],
    producerNote:
      typeof source.producerNote === "string"
        ? source.producerNote
        : EMPTY_COACH_FEEDBACK.producerNote,
  };
}
