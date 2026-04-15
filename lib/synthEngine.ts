import { getAudioContext, resumeAudio } from "@/lib/audioCore";
import { midiToFrequency } from "@/lib/music";

/**
 * Browser synth engine for the melody lane.
 * Voices are layered and routed through a shared delay/compression bus for a consistent lead sound.
 */
let synthBus: GainNode | null = null;

export type SynthWaveform = "sine" | "sawtooth" | "square";

function getSynthBus(ac: AudioContext) {
  if (synthBus) {
    return synthBus;
  }

  const input = ac.createGain();
  const dry = ac.createGain();
  const wet = ac.createGain();
  const delay = ac.createDelay(0.6);
  const feedback = ac.createGain();
  const tone = ac.createBiquadFilter();
  const compressor = ac.createDynamicsCompressor();

  // Every synth voice feeds this shared bus so delay and compression stay consistent across notes.
  input.gain.value = 0.58;
  wet.gain.value = 0.16;
  delay.delayTime.value = 0.22;
  feedback.gain.value = 0.2;
  tone.type = "lowpass";
  tone.frequency.value = 5600;
  compressor.threshold.value = -18;
  compressor.knee.value = 22;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.2;

  input.connect(dry);
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  dry.connect(tone);
  wet.connect(tone);
  tone.connect(compressor).connect(ac.destination);

  synthBus = input;
  return input;
}

function createSynthVoice(midi: number, waveform: SynthWaveform) {
  const ac = getAudioContext();
  const t = ac.currentTime;
  const frequency = midiToFrequency(midi);
  const filter = ac.createBiquadFilter();
  const amp = ac.createGain();
  const primary = ac.createOscillator();
  const shimmer = ac.createOscillator();
  const sub = ac.createOscillator();
  const primaryGain = ac.createGain();
  const shimmerGain = ac.createGain();
  const subGain = ac.createGain();

  // The lead voice blends the selected waveform, a slightly detuned shimmer layer, and a sine sub.
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(waveform === "sine" ? 2800 : 4600, t);
  filter.frequency.exponentialRampToValueAtTime(
    waveform === "square" ? 1500 : 2200,
    t + 0.22
  );
  filter.Q.value = waveform === "square" ? 10 : 7;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.15, t + 0.16);

  primary.type = waveform;
  primary.frequency.value = frequency;
  shimmer.type = waveform === "sine" ? "triangle" : waveform;
  shimmer.frequency.value = frequency;
  shimmer.detune.value = waveform === "sine" ? 7 : 6;
  sub.type = "sine";
  sub.frequency.value = frequency / 2;
  primaryGain.gain.value = waveform === "sine" ? 0.72 : 0.45;
  shimmerGain.gain.value = waveform === "sine" ? 0.12 : 0.22;
  subGain.gain.value = 0.15;

  primary.connect(primaryGain).connect(filter);
  shimmer.connect(shimmerGain).connect(filter);
  sub.connect(subGain).connect(filter);
  filter.connect(amp).connect(getSynthBus(ac));

  primary.start(t);
  shimmer.start(t);
  sub.start(t);

  return {
    stop: (when = ac.currentTime) => {
      const releaseStart = Math.max(when, ac.currentTime + 0.01);
      amp.gain.cancelScheduledValues(releaseStart);
      amp.gain.setValueAtTime(0.15, releaseStart);
      amp.gain.exponentialRampToValueAtTime(0.0001, releaseStart + 0.28);
      filter.frequency.cancelScheduledValues(releaseStart);
      filter.frequency.setValueAtTime(filter.frequency.value, releaseStart);
      filter.frequency.exponentialRampToValueAtTime(600, releaseStart + 0.24);
      primary.stop(releaseStart + 0.3);
      shimmer.stop(releaseStart + 0.3);
      sub.stop(releaseStart + 0.3);
    },
  };
}

export function startSynthNote(midi: number, waveform: SynthWaveform) {
  resumeAudio();
  return createSynthVoice(midi, waveform);
}

export function playSynthStep(
  midi: number,
  waveform: SynthWaveform,
  durationSeconds: number
) {
  const voice = startSynthNote(midi, waveform);
  voice.stop(getAudioContext().currentTime + Math.max(0.12, durationSeconds * 0.9));
}
