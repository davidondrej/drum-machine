import { normalizePattern, serializePattern } from "@/lib/sequencer";
import type { SynthWaveform } from "@/lib/synthEngine";

const MACHINE_STATE_STORAGE_KEY = "drum-machine-state";

function normalizeBpm(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 120;
  }

  return Math.min(240, Math.max(40, value));
}

export function readPersistedMachineState() {
  const stored = window.localStorage.getItem(MACHINE_STATE_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as { bpm?: unknown; pattern?: unknown };
    const normalized = normalizePattern(parsed.pattern);
    return {
      bpm: normalizeBpm(parsed.bpm),
      drumPattern: normalized.pattern.drums,
      melodyPattern: normalized.pattern.melody,
      synthWave: normalized.synthWave,
    };
  } catch {
    window.localStorage.removeItem(MACHINE_STATE_STORAGE_KEY);
    return null;
  }
}

export function writePersistedMachineState({
  bpm,
  drumPattern,
  melodyPattern,
  synthWave,
}: {
  bpm: number;
  drumPattern: boolean[][];
  melodyPattern: Array<number | null>;
  synthWave: SynthWaveform;
}) {
  window.localStorage.setItem(
    MACHINE_STATE_STORAGE_KEY,
    JSON.stringify({
      bpm,
      pattern: serializePattern({ drums: drumPattern, melody: melodyPattern }, synthWave),
    })
  );
}
