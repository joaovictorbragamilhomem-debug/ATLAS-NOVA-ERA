import { addDaysToISODate } from "@/lib/finance/dates";
import { formatISODateToBR } from "@/lib/masks";

// What the model may decide for each customer message. The model only picks
// an action and writes the text; everything with consequences (the real Pix
// code, saving a promise, alerting the store, stopping messages) is done by
// our code, after the checks in finalizeDecision().
export const ASSISTANT_ACTIONS = ["none", "send_pix", "promise", "paid_claim", "handoff", "opt_out"] as const;
export type AssistantAction = (typeof ASSISTANT_ACTIONS)[number];

export const PROMISE_MAX_DAYS = 10;
const MAX_REPLY_LENGTH = 800;

export type RawAssistantDecision = {
  reply: string | null;
  action: AssistantAction;
  promise_date: string | null;
  handoff_reason: string | null;
};

// Structured output schema (nullable fields as anyOf — the form the API
// documents as supported).
export const DECISION_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "WhatsApp message to the customer, in Brazilian Portuguese. Null when no answer is needed.",
    },
    action: { type: "string", enum: [...ASSISTANT_ACTIONS] },
    promise_date: {
      anyOf: [{ type: "string", format: "date" }, { type: "null" }],
      description: "Promised payment date (YYYY-MM-DD) when action is promise; otherwise null.",
    },
    handoff_reason: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "One short sentence in Portuguese for the store owner when action is handoff or paid_claim; otherwise null.",
    },
  },
  required: ["reply", "action", "promise_date", "handoff_reason"],
  additionalProperties: false,
} as const;

export type FinalDecision =
  | { action: "none"; reply: string | null }
  | { action: "send_pix"; reply: string }
  | { action: "promise"; reply: string; promiseDate: string }
  | { action: "paid_claim"; reply: string; reason: string }
  | { action: "handoff"; reply: string; reason: string }
  | { action: "opt_out"; reply: string };

export const DEFAULT_REPLIES = {
  sendPix: "Claro! Segue o Pix para pagamento:",
  paidClaim: "Obrigado por avisar! Se puder, mande o comprovante por aqui que eu repasso para a loja confirmar.",
  handoff: "Vou passar sua mensagem para alguém da loja, que te responde por aqui, tudo bem?",
  optOut: "Tudo bem, você não vai mais receber mensagens automáticas por aqui. Se precisar, é só chamar.",
  promise: (isoDate: string) =>
    `Combinado! Anotei o pagamento para ${formatISODateToBR(isoDate)}. Nesse dia te mando um lembrete por aqui.`,
};

// A Pix "copia e cola" always starts with 000201 and carries br.gov.bcb.pix —
// the model must never write one (it would be made up).
function looksLikePixCode(text: string): boolean {
  return /br\.gov\.bcb\.pix/i.test(text) || /000201\d{2}/.test(text);
}

function cleanReply(reply: string | null): string | null {
  if (reply === null) return null;
  const trimmed = reply.trim();
  if (!trimmed || looksLikePixCode(trimmed)) return null;
  return trimmed.length > MAX_REPLY_LENGTH ? `${trimmed.slice(0, MAX_REPLY_LENGTH - 1)}…` : trimmed;
}

function cleanReason(reason: string | null, fallback: string): string {
  const trimmed = reason?.trim();
  return trimmed ? trimmed.slice(0, 300) : fallback;
}

function handoff(reason: string): FinalDecision {
  return { action: "handoff", reply: DEFAULT_REPLIES.handoff, reason };
}

export function isValidPromiseDate(date: string | null, today: string): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return date >= today && date <= addDaysToISODate(today, PROMISE_MAX_DAYS);
}

export function finalizeDecision(
  raw: RawAssistantDecision,
  ctx: { today: string; hasPix: boolean; hasOpenInstallment: boolean }
): FinalDecision {
  const reply = cleanReply(raw.reply);

  switch (raw.action) {
    case "none":
      return { action: "none", reply };

    case "send_pix":
      if (!ctx.hasOpenInstallment) return handoff("Cliente pediu o Pix, mas não há parcela em aberto no sistema.");
      if (!ctx.hasPix) return handoff("Cliente pediu o Pix, mas a chave Pix da loja não está configurada.");
      return { action: "send_pix", reply: reply ?? DEFAULT_REPLIES.sendPix };

    case "promise":
      if (!ctx.hasOpenInstallment) return handoff("Cliente falou em data de pagamento, mas não há parcela em aberto.");
      if (!isValidPromiseDate(raw.promise_date, ctx.today)) {
        return handoff(
          raw.promise_date
            ? `Cliente quer pagar em ${formatISODateToBR(raw.promise_date)} — combine com ele.`
            : "Cliente quer combinar outra data de pagamento."
        );
      }
      // The model's own text, when present, already confirms the date; the
      // default covers a missing reply.
      return { action: "promise", reply: reply ?? DEFAULT_REPLIES.promise(raw.promise_date), promiseDate: raw.promise_date };

    case "paid_claim":
      return {
        action: "paid_claim",
        reply: reply ?? DEFAULT_REPLIES.paidClaim,
        reason: cleanReason(raw.handoff_reason, "Cliente disse que já pagou — confira e dê baixa."),
      };

    case "handoff":
      return {
        action: "handoff",
        reply: reply ?? DEFAULT_REPLIES.handoff,
        reason: cleanReason(raw.handoff_reason, "O cliente precisa de atenção de alguém da loja."),
      };

    case "opt_out":
      return { action: "opt_out", reply: reply ?? DEFAULT_REPLIES.optOut };

    default:
      return handoff("O assistente não soube como responder.");
  }
}
