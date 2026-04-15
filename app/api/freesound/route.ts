import { NextResponse } from "next/server";
import {
  pickPreviewUrl,
  type FreesoundSearchResponse,
  type FreesoundSound,
} from "@/lib/freesound";

export const runtime = "nodejs";

const SEARCH_FIELDS = "id,name,previews,username,tags,license";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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
    tags: isStringArray(value.tags) ? value.tags : [],
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
  const query = searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }
  const page = searchParams.get("page")?.trim() || "1";
  const pageSize = searchParams.get("page_size")?.trim() || "20";

  const url = new URL("https://freesound.org/apiv2/search/");
  url.searchParams.set("query", query);
  url.searchParams.set("fields", SEARCH_FIELDS);
  url.searchParams.set("page", page);
  url.searchParams.set("page_size", pageSize);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { count?: unknown; next?: unknown; previous?: unknown; detail?: string; results?: unknown[] }
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

    const body: FreesoundSearchResponse = {
      count: typeof payload?.count === "number" ? payload.count : results.length,
      next: typeof payload?.next === "string" ? payload.next : null,
      previous: typeof payload?.previous === "string" ? payload.previous : null,
      results,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Freesound did not respond." },
      { status: 502 }
    );
  }
}
