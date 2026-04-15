export interface FreesoundSound {
  id: number;
  name: string;
  username: string;
  license: string;
  tags: string[];
  previewUrl: string;
  previewOggUrl: string | null;
}

export interface FreesoundSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreesoundSound[];
}

export interface DrumSampleAssignment {
  soundId: number;
  name: string;
  username: string;
  license: string;
  previewUrl: string;
}

export function pickPreviewUrl(previews: Record<string, unknown>) {
  const mp3 = typeof previews["preview-hq-mp3"] === "string"
    ? previews["preview-hq-mp3"]
    : typeof previews["preview-lq-mp3"] === "string"
      ? previews["preview-lq-mp3"]
      : null;

  const ogg = typeof previews["preview-hq-ogg"] === "string"
    ? previews["preview-hq-ogg"]
    : typeof previews["preview-lq-ogg"] === "string"
      ? previews["preview-lq-ogg"]
      : null;

  return {
    previewUrl: mp3 || ogg,
    previewOggUrl: ogg,
  };
}

export function createDrumSampleAssignment(sound: FreesoundSound): DrumSampleAssignment {
  return {
    soundId: sound.id,
    name: sound.name,
    username: sound.username,
    license: sound.license,
    previewUrl: sound.previewUrl,
  };
}
