import type { SynthWaveform } from "@/lib/synthEngine";

export const NUM_DRUMS = 16;
export const NUM_STEPS = 8;

export interface MachinePattern {
  drums: boolean[][];
  melody: Array<number | null>;
}

interface PersistedPatternV2 {
  version: 2;
  drums: boolean[][];
  melody: Array<number | null>;
  synthWave: SynthWaveform;
}

function isWaveform(value: unknown): value is SynthWaveform {
  return value === "sine" || value === "sawtooth" || value === "square";
}

export function createEmptyDrumPattern() {
  return Array.from({ length: NUM_DRUMS }, () => Array(NUM_STEPS).fill(false));
}

export function createEmptyMelodyPattern() {
  return Array.from({ length: NUM_STEPS }, () => null as number | null);
}

export function createEmptyPattern(): MachinePattern {
  return {
    drums: createEmptyDrumPattern(),
    melody: createEmptyMelodyPattern(),
  };
}

export function cloneDrumPattern(pattern: boolean[][]) {
  return pattern.map((row) => [...row]);
}

export function clonePattern(pattern: MachinePattern): MachinePattern {
  return {
    drums: cloneDrumPattern(pattern.drums),
    melody: [...pattern.melody],
  };
}

function sanitizeDrums(value: unknown) {
  const empty = createEmptyDrumPattern();
  if (!Array.isArray(value)) {
    return empty;
  }

  return empty.map((row, rowIndex) =>
    row.map((_, stepIndex) => Boolean(value[rowIndex]?.[stepIndex]))
  );
}

function sanitizeMelody(value: unknown) {
  const empty = createEmptyMelodyPattern();
  if (!Array.isArray(value)) {
    return empty;
  }

  return empty.map((_, index) => {
    const note = value[index];
    return typeof note === "number" ? note : null;
  });
}

export function serializePattern(
  pattern: MachinePattern,
  synthWave: SynthWaveform
): PersistedPatternV2 {
  return {
    version: 2,
    drums: cloneDrumPattern(pattern.drums),
    melody: [...pattern.melody],
    synthWave,
  };
}

export function normalizePattern(value: unknown) {
  if (Array.isArray(value)) {
    return {
      pattern: {
        drums: sanitizeDrums(value),
        melody: createEmptyMelodyPattern(),
      },
      synthWave: "sawtooth" as SynthWaveform,
    };
  }

  if (value && typeof value === "object") {
    const source = value as Partial<PersistedPatternV2>;
    return {
      pattern: {
        drums: sanitizeDrums(source.drums),
        melody: sanitizeMelody(source.melody),
      },
      synthWave: isWaveform(source.synthWave) ? source.synthWave : "sawtooth",
    };
  }

  return {
    pattern: createEmptyPattern(),
    synthWave: "sawtooth" as SynthWaveform,
  };
}

export function countPatternEvents(value: unknown) {
  const { pattern } = normalizePattern(value);
  const drumEvents = pattern.drums.flat().filter(Boolean).length;
  const melodyEvents = pattern.melody.filter((note) => note !== null).length;
  return drumEvents + melodyEvents;
}
