import { NextResponse } from "next/server";
import { pickPreviewUrl, type FreesoundSound } from "@/lib/freesound";

export const runtime = "nodejs";

const SEARCH_FIELDS = "id,name,username,license,duration,previews";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFreesoundSound(value: unknown): FreesoundSound | null {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.name !== "string") {
    return null;
  }

  const previews = isRecord(value.previews) ? value.previews : {};
  const { previewUrl, previewOggUrl } = pickPreviewUrl(previews);
  if (!previewUrl) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    username: typeof value.username === "string" ? value.username : "unknown",
    license: typeof value.license === "string" ? value.license : "Unknown license",
    duration: typeof value.duration === "number" ? value.duration : 0,
    previewUrl,
    previewOggUrl,
  };
}

export async function GET(request: Request) {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FREESOUND_API_KEY is missing on the server." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  const url = new URL("https://freesound.org/apiv2/search/");
  url.searchParams.set("query", query);
  url.searchParams.set("fields", SEARCH_FIELDS);
  url.searchParams.set("page_size", "12");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { detail?: string; results?: unknown[] }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.detail || "Freesound search failed." },
        { status: response.status }
      );
    }

    const results = Array.isArray(payload?.results)
      ? payload.results
          .map((result) => toFreesoundSound(result))
          .filter((result): result is FreesoundSound => result !== null)
      : [];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Freesound did not respond." },
      { status: 502 }
    );
  }
}
