let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function getAudioContext() {
  if (!ctx) {
    ctx = new AudioContext();
  }

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  return ctx;
}

export function createNoiseSource(ac = getAudioContext()) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const channel = noiseBuffer.getChannelData(0);

    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }
  }

  const source = ac.createBufferSource();
  source.buffer = noiseBuffer;
  return source;
}

export function resumeAudio() {
  void getAudioContext();
}
