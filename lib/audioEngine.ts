let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function createNoiseBuffer(duration: number): AudioBuffer {
  const ac = getCtx();
  const size = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, size, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// 0: Kick
function playKick() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}

// 1: Snare
function playSnare() {
  const ac = getCtx();
  const t = ac.currentTime;

  // Noise
  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.2);
  const nf = ac.createBiquadFilter();
  nf.type = "highpass";
  nf.frequency.value = 1000;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.8, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  noise.connect(nf).connect(ng).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.2);

  // Body
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 185;
  const og = ac.createGain();
  og.gain.setValueAtTime(0.6, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(og).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

// 2: Closed Hi-Hat
function playClosedHH() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.08);
  const f = ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  noise.connect(f).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

// 3: Open Hi-Hat
function playOpenHH() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.4);
  const f = ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 6000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  noise.connect(f).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.4);
}

// 4: Clap
function playClap() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.3);
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2500;
  f.Q.value = 3;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  // Stutter effect
  for (let i = 0; i < 3; i++) {
    g.gain.setValueAtTime(0.8, t + i * 0.015);
    g.gain.setValueAtTime(0.2, t + i * 0.015 + 0.008);
  }
  g.gain.setValueAtTime(0.8, t + 0.045);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(f).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.3);
}

// 5: Rimshot
function playRimshot() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 400;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.05);

  // Click layer
  const osc2 = ac.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = 800;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.3, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  osc2.connect(g2).connect(ac.destination);
  osc2.start(t);
  osc2.stop(t + 0.02);
}

// 6: Low Tom
function playLowTom() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.35);
}

// 7: Mid Tom
function playMidTom() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(170, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

// 8: High Tom
function playHighTom() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.1);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

// 9: Cowbell
function playCowbell() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc1 = ac.createOscillator();
  osc1.type = "square";
  osc1.frequency.value = 560;
  const osc2 = ac.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = 845;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 800;

  osc1.connect(f);
  osc2.connect(f);
  f.connect(g).connect(ac.destination);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.2);
  osc2.stop(t + 0.2);
}

// 10: Crash
function playCrash() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(1.0);
  const f = ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 4000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  noise.connect(f).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 1.0);
}

// 11: Shaker
function playShaker() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.08);
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 8000;
  f.Q.value = 2;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  noise.connect(f).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

// 12: Conga
function playConga() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

// 13: Bongo
function playBongo() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(280, t + 0.05);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

// 14: Tambourine
function playTambourine() {
  const ac = getCtx();
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(0.15);
  const f1 = ac.createBiquadFilter();
  f1.type = "bandpass";
  f1.frequency.value = 5000;
  f1.Q.value = 2;
  const f2 = ac.createBiquadFilter();
  f2.type = "highpass";
  f2.frequency.value = 3000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  noise.connect(f1).connect(f2).connect(g).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.15);
}

// 15: Woodblock
function playWoodblock() {
  const ac = getCtx();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 800;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.04);

  // Overtone
  const osc2 = ac.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 1600;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.25, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  osc2.connect(g2).connect(ac.destination);
  osc2.start(t);
  osc2.stop(t + 0.025);
}

export interface DrumSound {
  name: string;
  play: () => void;
  color: string;
}

export const SOUNDS: DrumSound[] = [
  { name: "Kick", play: playKick, color: "#ff0055" },
  { name: "Snare", play: playSnare, color: "#00ff88" },
  { name: "Hi-Hat", play: playClosedHH, color: "#00ccff" },
  { name: "Open HH", play: playOpenHH, color: "#ffcc00" },
  { name: "Clap", play: playClap, color: "#ff6600" },
  { name: "Rimshot", play: playRimshot, color: "#cc00ff" },
  { name: "Low Tom", play: playLowTom, color: "#ff0088" },
  { name: "Mid Tom", play: playMidTom, color: "#00ffcc" },
  { name: "High Tom", play: playHighTom, color: "#88ff00" },
  { name: "Cowbell", play: playCowbell, color: "#ff3300" },
  { name: "Crash", play: playCrash, color: "#0066ff" },
  { name: "Shaker", play: playShaker, color: "#ffff00" },
  { name: "Conga", play: playConga, color: "#ff00cc" },
  { name: "Bongo", play: playBongo, color: "#00ff44" },
  { name: "Tamb.", play: playTambourine, color: "#ff8800" },
  { name: "Wood", play: playWoodblock, color: "#44ccff" },
];

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}
