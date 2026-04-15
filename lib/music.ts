/**
 * Small MIDI helpers shared by the synth engine and keyboard UI.
 * `whiteIndex` is precomputed so the keyboard can position white and black keys consistently.
 */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_NOTES = new Set([0, 2, 4, 5, 7, 9, 11]);

export const KEYBOARD_START_MIDI = 60;
export const KEYBOARD_END_MIDI = 83;

export interface KeyboardKey {
  midi: number;
  label: string;
  note: string;
  octave: number;
  isSharp: boolean;
  whiteIndex: number;
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiToLabel(midi: number) {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function createKeyboardKeys(start: number, end: number) {
  const keys: KeyboardKey[] = [];
  let whiteIndex = 0;

  for (let midi = start; midi <= end; midi += 1) {
    const noteIndex = ((midi % 12) + 12) % 12;
    const note = NOTE_NAMES[noteIndex];
    const isSharp = !WHITE_NOTES.has(noteIndex);
    const octave = Math.floor(midi / 12) - 1;

    keys.push({
      midi,
      label: `${note}${octave}`,
      note,
      octave,
      isSharp,
      whiteIndex,
    });

    if (!isSharp) {
      whiteIndex += 1;
    }
  }

  return keys;
}

export const KEYBOARD_KEYS = createKeyboardKeys(
  KEYBOARD_START_MIDI,
  KEYBOARD_END_MIDI
);
