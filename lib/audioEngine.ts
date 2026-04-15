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
  playDefault: () => void;
}

export const DRUM_SOUNDS: DrumSound[] = [
  { name: "Kick", color: "#ff0055", playDefault: playKick },
  { name: "Snare", color: "#00ff88", playDefault: playSnare },
  { name: "Hi-Hat", color: "#00ccff", playDefault: playClosedHH },
  { name: "Open HH", color: "#ffcc00", playDefault: playOpenHH },
  { name: "Clap", color: "#ff6600", playDefault: playClap },
  { name: "Rimshot", color: "#cc00ff", playDefault: playRimshot },
  { name: "Low Tom", color: "#ff0088", playDefault: () => playTom(120, 55, 0.34) },
  { name: "Mid Tom", color: "#00ffcc", playDefault: () => playTom(170, 82, 0.28) },
  { name: "High Tom", color: "#88ff00", playDefault: () => playTom(220, 110, 0.23) },
  { name: "Cowbell", color: "#ff3300", playDefault: playCowbell },
  { name: "Crash", color: "#0066ff", playDefault: playCrash },
  { name: "Shaker", color: "#ffff00", playDefault: playShaker },
  { name: "Conga", color: "#ff00cc", playDefault: () => playCrashTom(280, 180, 0.18) },
  { name: "Bongo", color: "#00ff44", playDefault: () => playCrashTom(400, 280, 0.1) },
  { name: "Tamb.", color: "#ff8800", playDefault: playTambourine },
  { name: "Wood", color: "#44ccff", playDefault: playWoodblock },
];
