import {
  playClap,
  playClosedHH,
  playCowbell,
  playCrash,
  playCrashTom,
  playKick,
  playOpenHH,
  playRimshot,
  playShaker,
  playSnare,
  playTambourine,
  playTom,
  playWoodblock,
} from "@/lib/drumVoices";

export interface DrumSound {
  name: string;
  color: string;
  play: () => void;
}

export const DRUM_SOUNDS: DrumSound[] = [
  { name: "Kick", color: "#ff0055", play: playKick },
  { name: "Snare", color: "#00ff88", play: playSnare },
  { name: "Hi-Hat", color: "#00ccff", play: playClosedHH },
  { name: "Open HH", color: "#ffcc00", play: playOpenHH },
  { name: "Clap", color: "#ff6600", play: playClap },
  { name: "Rimshot", color: "#cc00ff", play: playRimshot },
  { name: "Low Tom", color: "#ff0088", play: () => playTom(120, 55, 0.34) },
  { name: "Mid Tom", color: "#00ffcc", play: () => playTom(170, 82, 0.28) },
  { name: "High Tom", color: "#88ff00", play: () => playTom(220, 110, 0.23) },
  { name: "Cowbell", color: "#ff3300", play: playCowbell },
  { name: "Crash", color: "#0066ff", play: playCrash },
  { name: "Shaker", color: "#ffff00", play: playShaker },
  { name: "Conga", color: "#ff00cc", play: () => playCrashTom(280, 180, 0.18) },
  { name: "Bongo", color: "#00ff44", play: () => playCrashTom(400, 280, 0.1) },
  { name: "Tamb.", color: "#ff8800", play: playTambourine },
  { name: "Wood", color: "#44ccff", play: playWoodblock },
];
