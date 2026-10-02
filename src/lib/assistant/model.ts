import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_ACTIONS, DECISION_SCHEMA, type RawAssistantDecision } from "./decision";

const MODEL = "claude-opus-5-5";

export type ModelResult =
  | { decision: RawAssistantDecision; inputTokens: number; outputTokens: number }
  | { error: string };

export function isAssistantModelConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const REFUSAL_DECISION: RawAssistantDecision = {
  reply: null,
  action: "handoff",
  promise_date: null,
  handoff_reason: "O assistente não pôde responder essa mensagem — responda você mesmo.",
};

// One request per customer message: the model returns the reply text and
// one action as structured JSON; our code validates and executes it.
export async function askAssistantModel(system: string, user: string): Promise<ModelResult> {
  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      // Server-side fallback: if the model declines, the API retries on the
      // model Anthropic recommends for that refusal category.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: DECISION_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: user }],
    });

    const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };

    if (response.stop_reason === "refusal") return { decision: REFUSAL_DECISION, ...usage };
    if (response.stop_reason === "max_tokens") return { error: "resposta cortada (max_tokens)" };

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return { error: "resposta sem texto" };

    const parsed = JSON.parse(textBlock.text) as RawAssistantDecision;
    if (!ASSISTANT_ACTIONS.includes(parsed.action)) return { error: `ação inválida: ${String(parsed.action)}` };
    return { decision: parsed, ...usage };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("[assistant model]", error.status, error.message);
      return { error: `IA indisponível (${error.status ?? "rede"})` };
    }
    console.error("[assistant model]", error);
    return { error: "IA indisponível" };
  }
}
