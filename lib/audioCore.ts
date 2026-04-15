/**
 * Shared Web Audio primitives used by both the synthesized voices and loaded samples.
 * This module owns the singleton AudioContext so timing-sensitive code does not create competing contexts.
 */
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
// Cache in-flight decode work per URL so concurrent callers reuse the same fetch and decode.
const sampleBufferCache = new Map<string, Promise<AudioBuffer>>();

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

export async function loadAudioBuffer(url: string) {
  const existing = sampleBufferCache.get(url);
  if (existing) {
    return existing;
  }

  // Cache the pending promise, not just the resolved buffer, to dedupe concurrent loads.
  const pending = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Sample request failed.");
      }

      const bytes = await response.arrayBuffer();
      return await getAudioContext().decodeAudioData(bytes.slice(0));
    })
    .catch((error) => {
      // Drop failed entries so a later retry can fetch the URL again.
      sampleBufferCache.delete(url);
      throw error;
    });

  sampleBufferCache.set(url, pending);
  return pending;
}

export function playAudioBuffer(buffer: AudioBuffer) {
  const ac = getAudioContext();
  const source = ac.createBufferSource();
  const gain = ac.createGain();

  gain.gain.value = 1;
  source.buffer = buffer;
  source.connect(gain).connect(ac.destination);
  source.start(ac.currentTime);

  return {
    stop() {
      try {
        source.stop();
      } catch {}
    },
  };
}
