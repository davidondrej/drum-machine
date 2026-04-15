# Freesound API Docs

**# Freesound API Integration Guide for Next.js Drum Machine App**

**Version:** 1.0 (April 2026)  
**Author:** Grok (with extensive research from official Freesound API documentation)  
**Purpose:** Complete, production-ready guide to implement the exact feature described in your `<change>` plan. All information is taken directly from the current official Freesound APIv2 documentation (as of April 2026).

## 1. Overview of Freesound APIv2

The Freesound APIv2 (`https://freesound.org/apiv2/`) lets you search, browse, and retrieve sounds and metadata. For your drum machine:
- You only need **search** + **preview URLs**.
- No full downloads or user uploads are required.
- **Previews** (mp3/ogg files generated automatically by Freesound) are the perfect fit: fast, unified format, and **do not require OAuth2**.

Key official sources (all browsed and verified):
- Main documentation: https://freesound.org/docs/api/
- Authentication: https://freesound.org/docs/api/authentication.html
- Resources (Search + Sound Instance): https://freesound.org/docs/api/resources_apiv2.html
- Overview & Throttling: https://freesound.org/docs/api/overview.html
- Terms of Use (API): https://freesound.org/help/tos_api/

## 2. Authentication – Token (API Key) Only

You **do not need OAuth2**. Token authentication is sufficient for search and preview URLs.

1. Create a Freesound account.
2. Apply for an API key at **https://freesound.org/apiv2/apply/** (free, instant approval for most use cases).
3. Store the key (long alphanumeric string) in your Next.js `.env.local`:
   ```env
   FREESOUND_API_KEY=your_actual_key_here
   ```

**How to send the key (two equivalent ways):**
- Query parameter: `?token=YOUR_KEY`
- Header: `Authorization: Token YOUR_KEY`

**Example request (curl):**
```bash
curl "https://freesound.org/apiv2/search/?query=808+kick&fields=id,name,previews&token=YOUR_KEY"
```

## 3. The Search Endpoint (Critical Details)

**Current endpoint (use this):**  
`GET https://freesound.org/apiv2/search/`

(The old `/apiv2/search/text/` is deprecated since November 2025 and now redirects. Always use the new unified `/apiv2/search/`.)

**Essential query parameters for your app:**

| Parameter      | Type     | Recommended value for drum machine                  | Description |
|----------------|----------|-----------------------------------------------------|-----------|
| `query`        | string   | `"808 kick"`, `"snare"`, `"hi hat"`                 | Main search text (tags, name, description, etc.) |
| `fields`       | string   | `id,name,previews,username,tags,license`           | **Must include `previews`** to get audio URLs in one call |
| `page_size`    | int      | `20` (max 150)                                      | Results per page |
| `page`         | int      | `1` (for first page)                                | Pagination |
| `filter`       | string   | e.g. `duration:[0.1 TO 2]` or `tag:drum`           | Optional Solr-style filters |
| `sort`         | string   | `score` (default) or `created_desc`                | Sorting |

**Response shape (sound list):**
```json
{
  "count": 1234,
  "next": "https://...&page=2",
  "previous": null,
  "results": [
    {
      "id": 123456,
      "name": "808 Kick - Punchy",
      "username": "someuser",
      "tags": ["808", "kick", "drum"],
      "license": "https://creativecommons.org/licenses/by/3.0/",
      "previews": {
        "preview-hq-mp3": "https://freesound.org/data/previews/123/123456-hq.mp3",
        "preview-lq-mp3": "...",
        "preview-hq-ogg": "...",
        "preview-lq-ogg": "..."
      }
    }
  ]
}
```

**Recommendation for your UI:**  
Always request `fields=id,name,previews,username,tags,license`.  
Use `preview-hq-mp3` for best quality (≈128 kbps, perfect for drum pads).

## 4. Preview URLs – No Authentication Required for Playback

- Previews are **publicly accessible** once you have the URL.
- You only need the API key to *obtain* the URL (via search).
- Direct playback in browser works with `<audio>` or Web Audio API.
- Confirmed in official docs: “Retrieving previews does not require OAuth2 authentication.”

**Example preview URL:**  
`https://freesound.org/data/previews/415/415362_6044691-hq.mp3`

## 5. Next.js Server-Side Proxy (`/api/freesound`)

**Why proxy?** Keeps your `FREESOUND_API_KEY` secret (never expose it client-side).

**File:** `app/api/freesound/route.ts` (App Router) or `pages/api/freesound.ts` (Pages Router)

```ts
// app/api/freesound/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('page_size') || '20';

  const fields = 'id,name,previews,username,tags,license';

  const apiUrl = new URL('https://freesound.org/apiv2/search/');
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('fields', fields);
  apiUrl.searchParams.set('page', page);
  apiUrl.searchParams.set('page_size', pageSize);
  // Add any other params the user sends

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Token ${process.env.FREESOUND_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

**Security note:** Add rate limiting (e.g. `next-rate-limit` or Upstash) on this route if your app becomes popular.

## 6. Frontend Integration (React/Next.js Component)

**Example Search Component:**

```tsx
'use client';
import { useState } from 'react';

export default function FreesoundSearch({ onSoundSelect }: { onSoundSelect: (url: string, name: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioRefs] = useState<{ [key: number]: HTMLAudioElement | null }>({});

  const search = async () => {
    setLoading(true);
    const res = await fetch(`/api/freesound?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  };

  const playPreview = (sound: any) => {
    const url = sound.previews['preview-hq-mp3'];
    const audio = new Audio(url);
    audio.play();
    // Optional: store ref if you want stop buttons
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search "808 kick" or "snare"'
        onKeyPress={(e) => e.key === 'Enter' && search()}
      />
      <button onClick={search}>Search</button>

      <ul>
        {results.map((sound) => (
          <li key={sound.id}>
            <strong>{sound.name}</strong> by {sound.username}
            <button onClick={() => playPreview(sound)}>▶ Preview</button>
            <button
              onClick={() =>
                onSoundSelect(sound.previews['preview-hq-mp3'], sound.name)
              }
            >
              Load into Pad
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Drum Pad Integration:**  
When user clicks “Load into Pad”, store the preview URL and the sound name in your pad state.  
Replace your Web Audio oscillator with:

```ts
const audioContext = new AudioContext();
const buffer = await fetch(url).then(r => r.arrayBuffer()).then(buf => audioContext.decodeAudioData(buf));
const source = audioContext.createBufferSource();
source.buffer = buffer;
source.connect(audioContext.destination);
source.start();
```

## 7. Rate Limits & Performance

- **Standard limits:** 60 requests per minute / 2000 requests per day.
- Search is under the standard limit.
- If you exceed → 429 Too Many Requests with `detail` field.
- For a drum machine app this is more than enough (users search occasionally).
- Cache search results client-side if you want to be extra polite.

## 8. Terms of Use & Legal Considerations (Important!)

- You **must** respect the individual Creative Commons license of every sound (usually shown in the `license` field).
- Most sounds require **attribution** (e.g. “808 Kick by username – CC BY”).
- You may **not** redistribute the entire database or store full copies permanently.
- Commercial use of the API itself requires separate negotiation with UPF (Freesound’s host).
- For a free drum machine app this is fine; just display proper attribution when possible.

Full terms: https://freesound.org/help/tos_api/

## 9. Potential Gotchas & Best Practices

- Always include `fields=...previews...` — otherwise you get no audio URLs.
- Preview URLs are stable but can theoretically change (rare).
- Test with common drum terms: “808”, “kick”, “snare”, “clap”, “hi-hat”, “tom”.
- Add a “Load more” button using `next` URL from the response if you want pagination.
- Handle 429 errors gracefully in the proxy.
- Consider adding a small disclaimer in your app: “Sounds from Freesound.org – respect licenses”.

## 10. Next Steps / Quick Start Checklist

1. Get API key → add to `.env.local`
2. Create `/api/freesound` proxy (copy code above)
3. Build the search UI component
4. Wire `onSoundSelect` to your drum pad state
5. Test search → preview → load into pad
6. Deploy and monitor rate-limit headers

You now have **everything** needed to implement the exact change you described. The integration is straightforward, secure (key stays server-side), and uses only the preview URLs as requested.

If you need the full TypeScript types, a complete working example repo structure, or help with the Web Audio sample loader, just ask!

----

# Freesound API Integration — Next.js Drum Machine

## Overview

This document covers everything needed to integrate the Freesound APIv2 into a Next.js drum machine app. The integration covers: obtaining an API key, the correct search endpoint (note: the old `/search/text/` was deprecated in November 2025), a Next.js App Router proxy route to keep the key server-side, the frontend search UI, and loading a sample into the Web Audio API to replace the default oscillator.[1]

***

## 1. Getting Your API Key

1. Create a free account at [freesound.org](https://freesound.org)
2. Visit **https://freesound.org/apiv2/apply/** to request a new API credential[2]
3. Under the "Client secret/Api key" column, copy the long alphanumeric string — that is your API key[3]
4. Store it in `.env.local` (never `.env` committed to git):

```env
FREESOUND_API_KEY=your_key_here
```

> **Important:** Use `.env.local` for Next.js so the key is never exposed in the client bundle. The variable must **not** be prefixed with `NEXT_PUBLIC_` or it will leak to the browser.

***

## 2. Authentication Strategy

Freesound APIv2 supports two auth strategies:[3]

| Strategy | When to use |
|---|---|
| **Token (API Key)** | Read-only operations: search, preview, sound metadata |
| **OAuth2** | Write operations: upload, rate, bookmark sounds |

For this drum machine feature, **Token authentication is all you need**. No OAuth2 flow is required because you are only searching and reading preview URLs.[3]

There are two ways to pass the token:[3]

**Option A — Query parameter:**
```
GET https://freesound.org/apiv2/search/?query=808+kick&token=YOUR_API_KEY
```

**Option B — Authorization header (preferred for server-side proxy):**
```
Authorization: Token YOUR_API_KEY
```

***

## 3. The Search Endpoint

### Base URL

```
GET https://freesound.org/apiv2/search/
```

> Note: The old `GET /apiv2/search/text/` endpoint was deprecated in November 2025 and redirects to `/apiv2/search/`. Use the new endpoint directly.[1]

### Key Parameters

| Parameter | Type | Description |
|---|---|---|
| `query` | string | Main search query, e.g. `808 kick`, `snare`, `hihat` |
| `fields` | string | **Critical.** Comma-separated fields to return. Always specify this to avoid extra requests[1] |
| `filter` | string | Solr-syntax filter, e.g. `type:wav`, `duration:[0.1 TO 2]` |
| `sort` | string | `score` (default), `downloads_desc`, `rating_desc`, `created_desc` |
| `page` | string | Page number (default: 1) |
| `page_size` | string | Results per page (default: 15, max: 150) |

### The `fields` Parameter — Critical for Performance

The official docs strongly recommend always including `fields` to get all needed metadata in a **single request**, avoiding extra per-sound API calls. For the drum machine use case, request:[1]

```
fields=id,name,username,duration,previews,tags,license,avg_rating,num_downloads
```

### The `previews` Field

The `previews` field returns a dictionary with four URLs:[1]

| Key | Quality | Format |
|---|---|---|
| `preview-hq-mp3` | ~128 kbps | MP3 |
| `preview-lq-mp3` | ~64 kbps | MP3 |
| `preview-hq-ogg` | ~192 kbps | OGG |
| `preview-lq-ogg` | ~80 kbps | OGG |

Use `preview-hq-mp3` as the primary URL and `preview-hq-ogg` as fallback — no OAuth required to access these.[4][1]

### Example Search Request

```bash
curl -H "Authorization: Token YOUR_API_KEY" \
  "https://freesound.org/apiv2/search/?query=808+kick&fields=id,name,username,duration,previews,tags,license,avg_rating&sort=downloads_desc&page_size=20&filter=duration:[0.05 TO 3]"
```

### Example Response Shape

```json
{
  "count": 1042,
  "next": "https://freesound.org/apiv2/search/?...",
  "previous": null,
  "results": [
    {
      "id": 171104,
      "name": "808 Kick.wav",
      "username": "SomeUser",
      "duration": 1.43,
      "avg_rating": 4.5,
      "tags": ["kick", "808", "drum", "bass"],
      "license": "Creative Commons 0",
      "previews": {
        "preview-hq-mp3": "https://cdn.freesound.org/previews/171/171104_..._hq.mp3",
        "preview-lq-mp3": "https://cdn.freesound.org/previews/171/171104_..._lq.mp3",
        "preview-hq-ogg": "https://cdn.freesound.org/previews/171/171104_..._hq.ogg",
        "preview-lq-ogg": "https://cdn.freesound.org/previews/171/171104_..._lq.ogg"
      }
    }
  ]
}
```

### Useful Filter Examples for Drum Sounds

```
filter=duration:[0.05 TO 3]          # Short percussive sounds only
filter=type:(wav OR mp3)             # Only wav or mp3 originals
filter=tag:kick                      # Must have "kick" tag
filter=avg_rating:[3 TO *]           # Only well-rated sounds
filter=duration:[0.05 TO 3] tag:drum # Combined filters
```

***

## 4. Rate Limits

The Freesound API has a **daily limit of ~2,000 requests per API key**. Keep this in mind:[5]

- Always use `fields` to batch metadata into a single request per search
- Do **not** make a separate `GET /apiv2/sounds/<id>/` call per result — include all needed fields in the search `fields` parameter
- Implement debouncing on the search input (e.g. 400ms) to avoid firing on every keystroke

***

## 5. Next.js API Route Proxy

Create the proxy at `app/api/freesound/route.ts`. This keeps the API key server-side only.[6][7]

```typescript
// app/api/freesound/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FREESOUND_BASE = 'https://freesound.org/apiv2';
const API_KEY = process.env.FREESOUND_API_KEY;

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Freesound API key not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');

  if (!query || query.trim() === '') {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  // Build Freesound search URL
  const params = new URLSearchParams({
    query: query.trim(),
    fields: 'id,name,username,duration,previews,tags,license,avg_rating,num_downloads',
    sort: 'downloads_desc',
    page_size: searchParams.get('page_size') ?? '20',
    page: searchParams.get('page') ?? '1',
    // Filter to short percussive sounds; adjust as needed
    filter: searchParams.get('filter') ?? 'duration:[0.05 TO 5]',
  });

  const freesoundUrl = `${FREESOUND_BASE}/search/?${params.toString()}`;

  try {
    const res = await fetch(freesoundUrl, {
      headers: {
        Authorization: `Token ${API_KEY}`,
      },
      // Next.js 14+ caches fetch by default; opt out for live search
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { error: `Freesound API error: ${res.status}`, detail: errorBody },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Freesound API', detail: String(err) },
      { status: 502 }
    );
  }
}
```

**How to call it from the frontend:**
```
GET /api/freesound?query=808+kick
GET /api/freesound?query=snare&page_size=10&page=2
```

***

## 6. Frontend Search Component

A self-contained React component with debounced search, results list, preview button, and a callback to load the sound into a drum pad.

```typescript
// components/FreesoundSearch.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FreesoundPreview {
  'preview-hq-mp3': string;
  'preview-lq-mp3': string;
  'preview-hq-ogg': string;
  'preview-lq-ogg': string;
}

interface FreesoundResult {
  id: number;
  name: string;
  username: string;
  duration: number;
  avg_rating: number;
  tags: string[];
  license: string;
  previews: FreesoundPreview;
}

interface Props {
  onSelectSound: (result: FreesoundResult) => void;
}

export default function FreesoundSearch({ onSelectSound }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FreesoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/freesound?query=${encodeURIComponent(q)}&page_size=15`
      );
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const handlePreview = (result: FreesoundResult) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (previewingId === result.id) {
      setPreviewingId(null);
      return;
    }
    const audio = new Audio(result.previews['preview-hq-mp3']);
    audio.onended = () => setPreviewingId(null);
    audio.play();
    audioRef.current = audio;
    setPreviewingId(result.id);
  };

  return (
    <div className="freesound-search">
      <input
        type="text"
        placeholder='Search Freesound... e.g. "808 kick" or "snare"'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p>Searching...</p>}
      {error && <p className="error">{error}</p>}

      <ul>
        {results.map((result) => (
          >
            <span className="sound-name">{result.name}</span>
            <span className="sound-meta">
              {result.duration.toFixed(2)}s · {result.username} · ★{result.avg_rating.toFixed(1)}
            </span>
            <div className="sound-actions">
              <button onClick={() => handlePreview(result)}>
                {previewingId === result.id ? '⏹ Stop' : '▶ Preview'}
              </button>
              <button onClick={() => onSelectSound(result)}>
                Load into Pad
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

***

## 7. Loading the Sample into the Drum Pad (Web Audio API)

When the user clicks "Load into Pad", fetch the preview MP3 URL, decode it into an `AudioBuffer`, and store it on the pad — replacing the oscillator.[8][9]

```typescript
// lib/audioLoader.ts

/**
 * Fetch a Freesound preview URL and decode it into an AudioBuffer.
 * Use this buffer instead of the default oscillator when triggering the pad.
 */
export async function loadSampleFromUrl(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch sample: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Play a decoded AudioBuffer immediately.
 * Web Audio requires a new BufferSource node each time[cite:23].
 */
export function playBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  destination?: AudioNode
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(destination ?? audioContext.destination);
  source.start(audioContext.currentTime);
  return source;
}
```

### Integrating with the Drum Pad

```typescript
// In your drum pad component or store

import { loadSampleFromUrl, playBuffer } from '@/lib/audioLoader';

// Per-pad state shape
interface PadState {
  padId: number;
  label: string;
  buffer: AudioBuffer | null;      // null = use default oscillator
  freesoundMeta: FreesoundResult | null;
}

// On "Load into Pad" callback from FreesoundSearch
async function handleLoadSound(result: FreesoundResult, padId: number) {
  const audioContext = getOrCreateAudioContext(); // your existing context
  const url = result.previews['preview-hq-mp3'];

  try {
    const buffer = await loadSampleFromUrl(audioContext, url);
    setPadBuffer(padId, buffer, result); // update your pad state
  } catch (err) {
    console.error('Failed to load Freesound sample:', err);
  }
}

// When pad is triggered (click / MIDI / sequencer)
function triggerPad(pad: PadState) {
  const audioContext = getOrCreateAudioContext();
  if (pad.buffer) {
    // Use the real sample
    playBuffer(audioContext, pad.buffer);
  } else {
    // Fall back to your existing oscillator implementation
    playOscillator(audioContext, pad);
  }
}
```

> **Browser autoplay policy:** `AudioContext` must be created or resumed inside a user gesture (e.g. click handler). The context will be in `suspended` state otherwise. Call `audioContext.resume()` when the user first interacts with the UI.[9]

***

## 8. CORS & Preview URLs

The Freesound CDN preview URLs (e.g. `https://cdn.freesound.org/previews/...`) are served with **open CORS headers**, so they can be fetched directly from the browser with `fetch()` or used as `<Audio>` `src` attributes without a proxy. Your proxy at `/api/freesound` only needs to handle the **search API calls** to keep the key secret — not the audio file fetches.[4]

***

## 9. `.env.local` Setup

```env
# .env.local (gitignored — never commit this file)
FREESOUND_API_KEY=your_api_key_from_freesound_apiv2_apply
```

In `next.config.js`, no extra config is needed — `process.env.FREESOUND_API_KEY` is automatically available in API routes and Server Components without the `NEXT_PUBLIC_` prefix.

***

## 10. Complete Integration Checklist

- [ ] **API Key:** Created at `https://freesound.org/apiv2/apply/` and stored in `.env.local`
- [ ] **Proxy route:** `app/api/freesound/route.ts` created, injects `Authorization: Token` header server-side
- [ ] **Search endpoint:** Using `GET /apiv2/search/` (not the deprecated `/search/text/`)
- [ ] **Fields param:** Always includes `previews` so preview URLs come back in the same request
- [ ] **Frontend component:** `FreesoundSearch.tsx` with debounced input, result list, preview toggle, and "Load" button
- [ ] **Audio loading:** `loadSampleFromUrl` fetches preview URL and decodes with `audioContext.decodeAudioData()`
- [ ] **Pad state:** Per-pad `AudioBuffer | null` with fallback to oscillator when null
- [ ] **AudioContext handling:** Resumed on first user interaction

***

## 11. Useful Filter Recipes for Drum Sounds

These can be passed as `filter=...` to `/api/freesound?query=...&filter=...`:

```
# Short one-shot samples (best for drum pads)
filter=duration:[0.05 TO 2]

# Well-rated samples only
filter=avg_rating:[3.5 TO *]

# High-quality originals (wav preferred)
filter=type:wav

# Combined: short, good wav files
filter=duration:[0.05 TO 2] type:wav avg_rating:[3 TO *]

# Specific drum types
query=808 kick    filter=tag:kick tag:808
query=snare hit   filter=tag:snare duration:[0.05 TO 1.5]
query=hi-hat      filter=tag:hihat duration:[0.01 TO 0.8]
query=clap        filter=tag:clap
query=cymbal      filter=tag:cymbal duration:[0.1 TO 4]
```

***

## 12. Key API Gotchas

| Issue | Solution |
|---|---|
| Old `/search/text/` endpoint returns redirects | Use `/apiv2/search/` directly — `/search/text/` was deprecated November 2025[1] |
| `previews` field missing from results | Always explicitly include `previews` in the `fields` param — it is not included by default[10] |
| `AudioContext` silent on first load | Call `context.resume()` inside a click handler before playing[9] |
| 2,000 request/day rate limit hit | Debounce search input (400ms+), avoid per-sound metadata fetches[5] |
| API key exposed in browser | Never use `NEXT_PUBLIC_FREESOUND_API_KEY` — always proxy through a route handler[6] |
| `decodeAudioData` fails on OGG in Safari | Primary URL: `preview-hq-mp3`; OGG fallback only needed in Firefox[4] |

