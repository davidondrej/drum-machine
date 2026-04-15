# Next.js 15 PWA — Complete Implementation Guide

## Overview

This guide covers every aspect of converting a Next.js 15 App Router application into an installable Progressive Web App: the `app/manifest.ts` metadata route, service worker registration patterns, cross-browser installability criteria, the `generateViewport`/`themeColor` API migration, and a cache-first offline strategy with network-only exceptions for auth and API routes.

***

## 1. Web App Manifest via `app/manifest.ts`

Next.js 15 App Router has first-class support for the Web App Manifest through a metadata route file convention. Simply create `app/manifest.ts` — Next.js will automatically serve it at `/manifest.webmanifest` and inject the correct `>` into the `<head>` with no manual configuration needed.[1][2]

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Audio App',
    short_name: 'AudioApp',
    description: 'Web Audio synthesis app',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
```

### Required Fields for Chrome Installability

Chrome's Lighthouse audit fails the manifest check if any of these fields are missing:[3]

| Field | Required value |
|-------|---------------|
| `name` or `short_name` | Any non-empty string |
| `icons` | Must include a **192×192** and a **512×512** PNG |
| `start_url` | Any valid URL (usually `"/"`) |
| `display` | `"standalone"`, `"fullscreen"`, `"minimal-ui"`, or `"window-controls-overlay"` |
| `prefer_related_applications` | Must be absent or `false` |

### Safari / iOS Considerations

Safari on iOS does not fire `beforeinstallprompt` and has no automatic install prompt. Users must manually use the Share → "Add to Home Screen" flow. For iOS compatibility, you must also add legacy `apple-touch-icon` link tags in your `app/layout.tsx` alongside the manifest, since older versions of iOS ignored manifest icon declarations:[4][5][6]

```tsx
// app/layout.tsx — head additions for iOS
/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="AudioApp" />
```

Since iOS 15.4 and later, manifest `icons` entries are read correctly by Safari, but the `apple-touch-icon` link tag still takes precedence if present.[7]

### Maskable Icons

A separate maskable icon is strongly recommended. On Android, icons without `purpose: "maskable"` receive a white background on adaptive icon shapes. The safe area rule requires your logo/content to stay within the central 80% of the image (a circle with radius equal to 40% of icon width); the outer region may be cropped. Use two separate icon entries — one with `purpose: "any"` and one with `purpose: "maskable"` — rather than the deprecated `"any maskable"` combined value, which Chrome now warns against.[8][9][10][11]

***

## 2. Service Worker Registration in App Router

Next.js 15 has **no built-in service worker bundling**. The official Next.js PWA guide recommends placing your service worker at `public/sw.js` and registering it from a `'use client'` component. This file is served statically and accessible to the browser at the root scope.[1]

### Registration Pattern (Official Next.js Approach)

```tsx
// app/components/ServiceWorkerRegistration.tsx
'use client'
import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // always recheck SW file, never serve stale SW from HTTP cache
        })
        .then((registration) => {
          console.log('SW registered, scope:', registration.scope)
        })
        .catch((err) => console.error('SW registration failed:', err))
    }
  }, [])

  return null
}
```

Mount this in `app/layout.tsx` so it runs on every page load. The `updateViaCache: 'none'` option is important — it prevents the browser from serving a cached version of `sw.js` itself, ensuring updates propagate correctly.[1]

### Minimal Fetch Handler for Install Eligibility

A service worker **must include a `fetch` event listener** to satisfy installability requirements in Chrome and most Chromium-based browsers. Even an empty passthrough handler is sufficient:[12][13]

```js
// public/sw.js — absolute minimum for install eligibility
self.addEventListener('fetch', (event) => {
  // passthrough — required for installability
})
```

However, a passthrough handler provides no offline value. A real implementation should at minimum respond with a cached fallback. Note: as of the current Chrome install criteria page, the service worker fetch handler requirement is still listed as a prerequisite for the `beforeinstallprompt` event.[14]

### Headers for `public/sw.js`

The official Next.js docs recommend configuring these response headers for the SW file in `next.config.js`:[1]

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}
```

### next-pwa vs. @serwist/next vs. Manual `public/sw.js`

The original `next-pwa` package (by shadowwalker) is **effectively abandoned** — it has received no new npm releases or active maintenance for over a year, and contains deprecated transitive dependencies. It should not be used for new projects.[15][16][17]

`@serwist/next` is the current recommended library, explicitly cited in the official Next.js PWA documentation as the option for offline support. It is maintained, supports App Router fully, and compiles your TypeScript service worker source (`app/sw.ts`) into `public/sw.js` via webpack. A manual `public/sw.js` is simpler but requires handwriting all caching logic. The trade-offs:[18][15][1]

| Approach | Complexity | Offline caching | App Router | Webpack req. |
|----------|-----------|-----------------|------------|-------------|
| Manual `public/sw.js` | Low | Manual | ✅ | No |
| `@serwist/next` | Medium | Automatic precache | ✅ | Yes (Turbopack guide available) |
| `next-pwa` (shadowwalker) | Low | Auto (deprecated) | ⚠️ Broken | Yes |

For a client-heavy Web Audio app where you control the caching logic precisely, a manual `public/sw.js` plus Workbox CDN imports (or bundled via a custom build step) is perfectly viable and avoids the webpack constraint.[19]

***

## 3. Installability Criteria: Chrome and Safari

### Chrome / Chromium Installability Checklist

Chrome fires `beforeinstallprompt` when **all** of the following are met:[14]

1. **Not already installed** — the PWA is not in the OS app list
2. **User engagement** — user has clicked/tapped the page at least once, *and* spent at least 30 seconds on the page (cumulative, across visits)
3. **HTTPS** — served over a secure origin (or `localhost` for dev)
4. **Valid manifest** including:
   - `short_name` or `name`
   - `icons` with both a **192×192** and a **512×512** entry
   - `start_url`
   - `display` set to `standalone`, `fullscreen`, `minimal-ui`, or `window-controls-overlay`
   - `prefer_related_applications` absent or `false`
5. **Service worker** with a `fetch` handler registered

Note: the installability check itself can take several seconds after the page loads. The `beforeinstallprompt` may not fire immediately. Chrome may still offer installation even if not all criteria are perfectly met — it uses internal heuristics.[20]

### Safari / iOS Installability

Safari on macOS does not support installability at all. On iOS:[20]
- No `beforeinstallprompt` event is ever fired[5][4]
- Install is purely manual via Share → "Add to Home Screen"
- The minimum requirements for a usable installed PWA are:
  - A linked web app manifest with `display: "standalone"`, `start_url`, `name`, and at least one icon
  - `apple-touch-icon` link element (180×180 recommended) in `<head>` for correct home screen icon
  - The page served over HTTPS
- Push notifications require iOS 16.4+ and the app must be installed to home screen first[21]

### Icon Size Summary

| Icon | Required for | Size |
|------|-------------|------|
| Standard | Chrome install prompt | 192×192, 512×512 |
| Maskable | Android adaptive icons (Lighthouse best practice) | 512×512, `purpose: "maskable"` |
| Apple Touch | iOS home screen icon | 180×180 (minimum), linked via `>` |

***

## 4. `generateViewport` and `themeColor`

Since Next.js 14, `themeColor` must **not** be set inside the `metadata` export. If placed there, Next.js emits a deprecation warning: `⚠ Unsupported metadata themeColor is configured in metadata export. Please move it to viewport export instead`.[22][23]

The correct pattern is to use the `Viewport` type exported from `next`:[24]

```ts
// app/layout.tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'My Audio App',
  description: '...',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AudioApp',
  },
}

// themeColor goes here, NOT in metadata
export const viewport: Viewport = {
  themeColor: '#7c3aed',
}
```

For dark/light mode adaptive theme colors, pass an array with `media` queries:[23][24]

```ts
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}
```

For dynamic values (e.g., per-page theme colors based on fetched data), use the `generateViewport` function instead of the static export:[25]

```ts
export async function generateViewport({ params }): Promise<Viewport> {
  const theme = await fetchTheme(params.id)
  return { themeColor: theme.color }
}
```

The `viewport` export and `generateViewport` function are mutually exclusive — use one or the other per layout/page file.

***

## 5. Cache-First App Shell + Network-Only for API/Auth Routes

### Architecture for a Web Audio App

For a client-side Web Audio synthesis app, the ideal service worker strategy is:

- **Precache the app shell** (HTML, JS bundles, CSS, WASM if used) at install time using `precacheAndRoute()`
- **Cache-first** for static assets (fonts, icons, audio samples)
- **Network-only** for API routes (`/api/*`) and authentication routes (`/auth/*`, sign-in, sign-out)
- **StaleWhileRevalidate** for infrequently-updated data endpoints if you want background refresh

### Using Workbox Directly (Manual `public/sw.js`)

```js
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// 1. Precache the app shell (JS/CSS/HTML built by Next.js)
// In a Serwist/Workbox build setup, self.__WB_MANIFEST is injected automatically
precacheAndRoute(self.__WB_MANIFEST ?? [])

// 2. Network-only for API routes — MUST be registered BEFORE any catch-all routes
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

// 3. Network-only for auth routes (NextAuth, Clerk, etc.)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-out'),
  new NetworkOnly()
)

// 4. Cache-first for static assets (long-lived, content-hashed by Next.js)
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 days
    ],
  })
)

// 5. Cache-first for images and audio samples
registerRoute(
  ({ request }) =>
    request.destination === 'image' ||
    request.destination === 'audio',
  new CacheFirst({
    cacheName: 'media-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
)

// 6. Stale-while-revalidate for fonts
registerRoute(
  ({ request }) => request.destination === 'font',
  new StaleWhileRevalidate({ cacheName: 'font-cache' })
)
```

**Critical ordering rule**: `NetworkOnly` routes for `/api/` and `/auth/` must be registered *before* any catch-all or default handler. `precacheAndRoute()` creates a cache-first route for precached URLs, and `registerRoute()` calls are evaluated in order — whichever matches first wins.[26][27]

### Using Serwist (`app/sw.ts` with `@serwist/next`)

```ts
// app/sw.ts
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Network-only for API and auth — must be first
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/sign-in'),
      handler: new NetworkOnly(),
    },
    // Fallback to defaultCache (StaleWhileRevalidate + CacheFirst for assets)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()
```

The Serwist `defaultCache` from `@serwist/next/worker` provides sensible defaults for Next.js (StaleWhileRevalidate for pages, CacheFirst for `_next/static` assets). Prepending your `NetworkOnly` rules before spreading `defaultCache` ensures they take precedence.[28]

### `next.config.ts` for Serwist

```ts
// next.config.ts
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist({
  // your Next.js config
})
```

Disabling the SW in development avoids stale cache conflicts while iterating.[19][18]

### Workbox `NetworkOnly` Strategy: Why Not Just Skip `respondWith`?

For routes you want to pass straight to the network, you have two options:[29][27]
1. **Don't call `event.respondWith()`** for those requests — the browser falls through to the network naturally
2. **Register an explicit `NetworkOnly` route** — this gives you access to Workbox plugin lifecycle hooks (`fetchDidFail`, `fetchDidSucceed`) and makes intent explicit

For auth and API routes in a production app, the explicit `NetworkOnly` registration is preferred because it allows attaching plugins like `BackgroundSyncPlugin` for POST retries.[30]

***

## Putting It All Together: Minimal Checklist

1. **`app/manifest.ts`** — export `MetadataRoute.Manifest` with `name`, `short_name`, `start_url`, `display: "standalone"`, `icons` (192 + 512 standard, 512 maskable)[2][1]
2. **`app/layout.tsx`** — add `apple-touch-icon` link tag and `apple-mobile-web-app-capable` meta for iOS; set `themeColor` via `viewport` export, not `metadata`[24][28]
3. **`public/sw.js`** (or `app/sw.ts` + Serwist) — must include a `fetch` handler; register `NetworkOnly` for `/api/*` and `/auth/*` first, then precache app shell[12][1]
4. **Service worker registration** — `'use client'` component calling `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })` in `useEffect`[1]
5. **HTTPS** — required for all installability and service worker registration (use `next dev --experimental-https` locally)[14][1]
6. **`next.config.js` headers** — set `no-cache` for `/sw.js` so the browser always fetches the latest version[1]