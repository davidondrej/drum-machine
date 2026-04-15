import { NextResponse } from "next/server";
import {
  normalizeCoachFeedback,
  type CoachFeedback,
  type MachineSnapshot,
} from "@/lib/producerCoach";
import { DEFAULT_COACH_MODEL, isCoachModelSlug } from "@/lib/coachModels";
import { createClient } from "@/utils/supabase/server";

/**
 * Authenticated producer-coach route.
 * It validates the visible machine snapshot, consumes quota in Supabase, and forwards a constrained prompt to OpenRouter.
 */
export const runtime = "nodejs";

interface QuotaResult {
  allowed: boolean;
  reason: string;
  remaining: number;
  retry_after_seconds: number;
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isMachineSnapshot(value: unknown): value is MachineSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Partial<MachineSnapshot>;
  return (
    typeof source.bpm === "number" &&
    (source.synthWave === "sine" || source.synthWave === "sawtooth" || source.synthWave === "square") &&
    Array.isArray(source.melodySteps) &&
    Array.isArray(source.melodyLabels) &&
    Array.isArray(source.drums) &&
    typeof source.promptSummary === "string"
  );
}

function getTextContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const part = item as { type?: string; text?: string };
        return part.type === "text" && typeof part.text === "string" ? part.text : "";
      })
      .join("");
  }

  return "";
}

function parseFeedback(raw: string): CoachFeedback {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
  return normalizeCoachFeedback(JSON.parse(cleaned));
}

function createPrompt(snapshot: MachineSnapshot) {
  // The prompt keeps the model grounded in visible state only so it does not invent mix or audio claims.
  return [
    "You are an experienced music producer coaching a beatmaker.",
    "You only know the visible sequencer state. Do not claim to hear audio or mix details.",
    "Be honest, specific, and a little blunt, but still useful.",
    "Focus on missing elements, weak decisions, and ways to make the loop less generic.",
    "Reference real instruments, step positions, BPM, waveform, density, and repetition from the snapshot.",
    "Keep every bullet practical and short.",
    "Return strict JSON with keys: summary, missingElements, tooSafe, specificMoves, producerNote.",
    "Each array should contain 2 to 4 strings.",
    `Snapshot: ${JSON.stringify(snapshot)}`,
  ].join("\n");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const apiKey = process.env.OPENROUTER_API_KEY;
  const dailyLimit = readPositiveInt(process.env.COACH_DAILY_LIMIT, 15);
  const cooldownSeconds = readPositiveInt(process.env.COACH_COOLDOWN_SECONDS, 12);

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is missing on the server." },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to use the AI coach." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { snapshot?: unknown; model?: unknown }
    | null;
  if (!isMachineSnapshot(body?.snapshot)) {
    return NextResponse.json({ error: "Invalid coach payload." }, { status: 400 });
  }
  const model = isCoachModelSlug(body?.model) ? body.model : DEFAULT_COACH_MODEL;

  // Quota is enforced server-side so the client cannot bypass the daily limit or cooldown window.
  const { data: quota, error: quotaError } = await supabase.rpc("consume_coach_quota", {
    p_daily_limit: dailyLimit,
    p_cooldown_seconds: cooldownSeconds,
  });

  if (quotaError) {
    return NextResponse.json(
      { error: "Could not verify coach quota." },
      { status: 500 }
    );
  }

  const quotaResult = (Array.isArray(quota) ? quota[0] : null) as QuotaResult | null;
  if (!quotaResult?.allowed) {
    const reason =
      quotaResult?.reason === "cooldown"
        ? `Slow down for ${quotaResult.retry_after_seconds} seconds.`
        : quotaResult?.reason === "daily_limit"
          ? `Daily coach limit reached. You have ${dailyLimit} requests per day.`
          : "Coach access is unavailable.";

    return NextResponse.json(
      {
        error: reason,
        remaining: quotaResult?.remaining ?? 0,
        retryAfterSeconds: quotaResult?.retry_after_seconds ?? 0,
      },
      { status: quotaResult?.reason === "unauthorized" ? 401 : 429 }
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are a sharp producer coach. You critique patterns directly and never pretend you heard rendered audio.",
          },
          {
            role: "user",
            content: createPrompt(body.snapshot),
          },
        ],
        response_format: { type: "json_object" },
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: { message?: string };
          choices?: Array<{ message?: { content?: unknown } }>;
        }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || "OpenRouter request failed." },
        { status: response.status }
      );
    }

    const content = getTextContent(payload?.choices?.[0]?.message?.content);
    const feedback = parseFeedback(content);
    return NextResponse.json({
      feedback,
      remaining: quotaResult.remaining,
      dailyLimit,
    });
  } catch {
    return NextResponse.json(
      { error: "The coach service failed to respond." },
      { status: 500 }
    );
  }
}
