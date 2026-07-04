import Anthropic from "@anthropic-ai/sdk";

// Model tiers. Debate turns run on the fast model; the Chair's verdict and
// script writing use the strongest model.
export const MODEL_FAST = "claude-sonnet-5";
export const MODEL_SMART = "claude-opus-4-8";

let cached: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  cached = new Anthropic({ apiKey });
  return cached;
}

/** One-shot completion, returns plain text. */
export async function complete(opts: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const msg = await anthropic().messages.create({
    model: opts.model ?? MODEL_FAST,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Completion that must return JSON; parses the first {...} or [...] block. */
export async function completeJSON<T>(opts: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await complete({ ...opts, maxTokens: opts.maxTokens ?? 1500 });
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (match ? match[1] : text).trim();
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error(`No JSON in model output: ${text.slice(0, 200)}`);
  return JSON.parse(raw.slice(start)) as T;
}
