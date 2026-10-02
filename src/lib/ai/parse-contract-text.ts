"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { todayInSaoPauloISODate, type Periodicity } from "@/lib/finance/dates";

// Campos que a IA consegue sugerir para o formulário de contrato. Tudo é
// opcional: o que a frase não disser fica em branco para a pessoa preencher.
export type ContractTextSuggestion = {
  principalAmountCents: number | null;
  installmentsCount: number | null;
  periodicity: Periodicity | null;
  firstDueDate: string | null;
  installmentAmountCents: number | null;
  lateFeePercent: number | null;
  lateInterestMonthlyPercent: number | null;
  notes: string | null;
};

export type ParseContractTextResult = { error: string } | { suggestion: ContractTextSuggestion };

const MODEL = "claude-opus-5-5";
const MAX_TEXT_LENGTH = 1000;

// Nullable fields as anyOf — the form the structured-outputs docs list as
// supported (type arrays are not).
const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    principal_amount_reais: { ...nullable({ type: "number" }), description: "Total the customer will pay, in BRL." },
    installments_count: { ...nullable({ type: "integer" }), description: "Number of installments." },
    periodicity: nullable({ type: "string", enum: ["weekly", "biweekly", "monthly"] }),
    first_due_date: { ...nullable({ type: "string", format: "date" }), description: "First due date, YYYY-MM-DD." },
    installment_amount_reais: { ...nullable({ type: "number" }), description: "Amount of each installment, in BRL." },
    late_fee_percent: { ...nullable({ type: "number" }), description: "One-time late fee, percent." },
    late_interest_monthly_percent: { ...nullable({ type: "number" }), description: "Late interest per month, percent." },
    notes: { ...nullable({ type: "string" }), description: "Relevant details that fit no other field." },
  },
  required: [
    "principal_amount_reais",
    "installments_count",
    "periodicity",
    "first_due_date",
    "installment_amount_reais",
    "late_fee_percent",
    "late_interest_monthly_percent",
    "notes",
  ],
  additionalProperties: false,
};

type RawSuggestion = {
  principal_amount_reais: number | null;
  installments_count: number | null;
  periodicity: Periodicity | null;
  first_due_date: string | null;
  installment_amount_reais: number | null;
  late_fee_percent: number | null;
  late_interest_monthly_percent: number | null;
  notes: string | null;
};

function buildSystemPrompt(today: string): string {
  return `You read a short note, written in Brazilian Portuguese by a small business owner, describing a sale on installments (crediário, carnê, fiado) or a credit agreement with a customer, and extract the contract fields for a form.

Today is ${today} (America/Sao_Paulo). Resolve relative dates against it: "dia 10" means the next 10th that is today or later; "mês que vem" means next month; "semana que vem" means 7 days from today.

Rules:
- Use null for anything the note does not state or clearly imply. Never invent values; the owner reviews every field before saving.
- Amounts are in reais. Brazilians write "1.500" for one thousand five hundred and "1,5 mil" for 1500.
- The total is what the customer will pay in all (e.g. the sale price on credit). "5x de 120" means 5 installments of 120. If only the total and the count are given, leave installment_amount_reais null (the form computes it). If only the count and installment amount are given, leave principal_amount_reais null unless the note states the total.
- periodicity: "por semana"/"semanal" -> weekly, "quinzenal"/"a cada 15 dias" -> biweekly, "por mês"/"mensal" -> monthly. If installments are mentioned with no period, use monthly.
- Ignore the customer's name and the product description except in notes: the contract is already linked to a customer.
- notes: only meaningful extra details (e.g. what was sold, a down payment already received), in Portuguese; otherwise null.`;
}

function toCents(reais: number | null): number | null {
  if (reais === null || !Number.isFinite(reais) || reais <= 0) return null;
  return Math.round(reais * 100);
}

function toSuggestion(raw: RawSuggestion): ContractTextSuggestion {
  const count = raw.installments_count;
  const dueDate = raw.first_due_date;
  return {
    principalAmountCents: toCents(raw.principal_amount_reais),
    installmentAmountCents: toCents(raw.installment_amount_reais),
    installmentsCount: count !== null && Number.isInteger(count) && count > 0 ? count : null,
    periodicity: raw.periodicity,
    firstDueDate: dueDate !== null && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null,
    lateFeePercent: raw.late_fee_percent !== null && raw.late_fee_percent >= 0 ? raw.late_fee_percent : null,
    lateInterestMonthlyPercent:
      raw.late_interest_monthly_percent !== null && raw.late_interest_monthly_percent >= 0
        ? raw.late_interest_monthly_percent
        : null,
    notes: raw.notes?.trim() || null,
  };
}

export async function parseContractTextAction(text: string): Promise<ParseContractTextResult> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente." };
  if (membership.role === "operator") return { error: "Só Dono ou Gestor podem criar contratos." };

  const note = text.trim();
  if (!note) return { error: "Escreva como foi o empréstimo." };
  if (note.length > MAX_TEXT_LENGTH) return { error: "Texto muito longo — resuma em poucas frases." };

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[ai] ANTHROPIC_API_KEY not configured");
    return { error: "O preenchimento com IA ainda não está disponível. Preencha os campos abaixo." };
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      // Server-side fallback: if the model declines, the API retries on the
      // model Anthropic recommends for that refusal category.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SUGGESTION_SCHEMA },
      },
      system: buildSystemPrompt(todayInSaoPauloISODate()),
      messages: [{ role: "user", content: note }],
    });

    if (response.stop_reason === "refusal") {
      return { error: "A IA não conseguiu interpretar esse texto. Preencha os campos abaixo." };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { error: "A IA não conseguiu interpretar esse texto. Preencha os campos abaixo." };
    }

    return { suggestion: toSuggestion(JSON.parse(textBlock.text) as RawSuggestion) };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { error: "Muitos pedidos seguidos — tente de novo em alguns segundos." };
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[ai] contract text parsing failed:", error.status, error.message);
    } else {
      console.error("[ai] contract text parsing failed:", error);
    }
    return { error: "Não foi possível usar a IA agora. Preencha os campos abaixo." };
  }
}
