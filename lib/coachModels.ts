/**
 * Model options exposed in the UI. The slug is the stable storage and API value;
 * the label is only for presentation.
 */
export const COACH_MODEL_OPTIONS = [
  {
    slug: "z-ai/glm-5.1",
    name: "GLM 5.1",
  },
  {
    slug: "minimax/minimax-m2.7",
    name: "MiniMax M2.7",
  },
  {
    slug: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
  },
  {
    slug: "openai/gpt-5.4-mini",
    name: "GPT-5.4 Mini",
  },
  {
    slug: "google/gemini-3.1-flash-lite-preview",
    name: "Gemini Flash Lite",
  },
] as const;

export type CoachModelSlug = (typeof COACH_MODEL_OPTIONS)[number]["slug"];

export const DEFAULT_COACH_MODEL: CoachModelSlug = "z-ai/glm-5.1";

const COACH_MODEL_SLUG_SET = new Set<string>(COACH_MODEL_OPTIONS.map((option) => option.slug));

export function isCoachModelSlug(value: unknown): value is CoachModelSlug {
  return typeof value === "string" && COACH_MODEL_SLUG_SET.has(value);
}

export function getCoachModelName(slug: CoachModelSlug) {
  return COACH_MODEL_OPTIONS.find((option) => option.slug === slug)?.name ?? "GLM 5.1";
}
