import { centsToReais } from "./money";

const BASE_URL =
  process.env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";

class AsaasError extends Error {}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new AsaasError("Asaas não está configurado no servidor.");

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "atlas-nova-era",
      access_token: apiKey,
      ...init?.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.errors?.[0]?.description ?? "Erro ao falar com a Asaas.";
    throw new AsaasError(message);
  }
  return body as T;
}

export type AsaasCustomer = { id: string };

export async function findOrCreateAsaasCustomer(params: {
  name: string;
  email: string;
  cpfCnpj?: string;
  externalReference: string;
}): Promise<AsaasCustomer> {
  const existing = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?externalReference=${encodeURIComponent(params.externalReference)}`
  );
  if (existing.data.length > 0) return existing.data[0];

  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
      externalReference: params.externalReference,
    }),
  });
}

export type AsaasSubscription = { id: string; status: string };

export async function createAsaasSubscription(params: {
  customerId: string;
  cycle: "MONTHLY" | "YEARLY";
  valueCents: number;
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      cycle: params.cycle,
      value: centsToReais(params.valueCents),
      description: params.description,
      externalReference: params.externalReference,
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    }),
  });
}

export type AsaasPayment = { id: string; invoiceUrl: string };

export async function createAsaasPayment(params: {
  customerId: string;
  valueCents: number;
  description: string;
  externalReference: string;
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      value: centsToReais(params.valueCents),
      description: params.description,
      externalReference: params.externalReference,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    }),
  });
}

export async function getSubscriptionInvoiceUrl(subscriptionId: string): Promise<string | null> {
  const payments = await asaasFetch<{ data: { invoiceUrl: string }[] }>(
    `/payments?subscription=${subscriptionId}&limit=1`
  );
  return payments.data[0]?.invoiceUrl ?? null;
}
