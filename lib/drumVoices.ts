import { createNoiseSource, getAudioContext } from "@/lib/audioCore";

function rampDown(gain: GainNode, start: number, peak: number, end: number) {
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
}

export function playKick() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.16);
  rampDown(gain, t, 1.15, t + 0.5);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}

export function playSnare() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const noiseFilter = ac.createBiquadFilter();
  const noiseGain = ac.createGain();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1400;
  rampDown(noiseGain, t, 0.75, t + 0.2);
  noise.connect(noiseFilter).connect(noiseGain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.2);
  const body = ac.createOscillator();
  const bodyGain = ac.createGain();
  body.type = "triangle";
  body.frequency.value = 190;
  rampDown(bodyGain, t, 0.45, t + 0.12);
  body.connect(bodyGain).connect(ac.destination);
  body.start(t);
  body.stop(t + 0.12);
}

export function playClosedHH() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "highpass";
  filter.frequency.value = 7600;
  rampDown(gain, t, 0.22, t + 0.05);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

export function playOpenHH() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "highpass";
  filter.frequency.value = 6200;
  rampDown(gain, t, 0.24, t + 0.32);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.4);
}

export function playClap() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 2.5;
  gain.gain.setValueAtTime(0.0001, t);
  [0, 0.018, 0.036].forEach((offset) => {
    gain.gain.setValueAtTime(0.7, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.15, t + offset + 0.01);
  });
  gain.gain.setValueAtTime(0.55, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.28);
}

export function playRimshot() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const click = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = 420;
  click.type = "square";
  click.frequency.value = 840;
  rampDown(gain, t, 0.5, t + 0.05);
  osc.connect(gain);
  click.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  click.start(t);
  osc.stop(t + 0.05);
  click.stop(t + 0.03);
}

export function playTom(start: number, end: number, duration: number) {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(start, t);
  osc.frequency.exponentialRampToValueAtTime(end, t + duration * 0.45);
  rampDown(gain, t, 0.72, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function playCowbell() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const bandpass = ac.createBiquadFilter();
  const gain = ac.createGain();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 860;
  bandpass.Q.value = 3;
  rampDown(gain, t, 0.3, t + 0.18);
  [560, 845].forEach((frequency) => {
    const osc = ac.createOscillator();
    osc.type = "square";
    osc.frequency.value = frequency;
    osc.connect(bandpass);
    osc.start(t);
    osc.stop(t + 0.18);
  });
  bandpass.connect(gain).connect(ac.destination);
}

export function playCrash() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "highpass";
  filter.frequency.value = 4200;
  rampDown(gain, t, 0.32, t + 0.82);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 1);
}

export function playShaker() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 8300;
  filter.Q.value = 2;
  rampDown(gain, t, 0.2, t + 0.06);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.08);
}

export function playCrashTom(frequency: number, dropTo: number, duration: number) {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, t);
  osc.frequency.exponentialRampToValueAtTime(dropTo, t + duration * 0.4);
  rampDown(gain, t, 0.62, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function playTambourine() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const noise = createNoiseSource(ac);
  const bandpass = ac.createBiquadFilter();
  const highpass = ac.createBiquadFilter();
  const gain = ac.createGain();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 5200;
  bandpass.Q.value = 2;
  highpass.type = "highpass";
  highpass.frequency.value = 3200;
  rampDown(gain, t, 0.28, t + 0.14);
  noise.connect(bandpass).connect(highpass).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.16);
}

export function playWoodblock() {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const base = ac.createOscillator();
  const overtone = ac.createOscillator();
  const gain = ac.createGain();
  base.type = "sine";
  overtone.type = "sine";
  base.frequency.value = 820;
  overtone.frequency.value = 1640;
  rampDown(gain, t, 0.42, t + 0.05);
  base.connect(gain);
  overtone.connect(gain);
  gain.connect(ac.destination);
  base.start(t);
  overtone.start(t);
  base.stop(t + 0.05);
  overtone.stop(t + 0.03);
}
