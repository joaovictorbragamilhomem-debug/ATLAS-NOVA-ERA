export type ActivationStageId = "signup" | "customer" | "contract" | "whatsapp" | "paying";

export type ActivationStage = {
  id: ActivationStageId;
  label: string;
  count: number;
  // null when there are no signups yet (avoids a meaningless 0/0).
  percentOfSignups: number | null;
};

export type ActivationSignals = {
  organizationIds: string[];
  withCustomer: ReadonlySet<string>;
  withContract: ReadonlySet<string>;
  withWhatsappConnected: ReadonlySet<string>;
  paying: ReadonlySet<string>;
};

// Milestones are counted independently (an account can connect WhatsApp
// before creating a contract), so this is "how many accounts reached each
// milestone", not a strict step-by-step funnel.
export function buildActivationFunnel(signals: ActivationSignals): ActivationStage[] {
  const total = signals.organizationIds.length;
  const countIn = (set: ReadonlySet<string>) => signals.organizationIds.filter((id) => set.has(id)).length;

  const stage = (id: ActivationStageId, label: string, count: number): ActivationStage => ({
    id,
    label,
    count,
    percentOfSignups: total === 0 ? null : Math.round((count / total) * 100),
  });

  return [
    stage("signup", "Cadastraram a empresa", total),
    stage("customer", "Cadastraram um cliente", countIn(signals.withCustomer)),
    stage("contract", "Criaram um contrato", countIn(signals.withContract)),
    stage("whatsapp", "Conectaram o WhatsApp", countIn(signals.withWhatsappConnected)),
    stage("paying", "Assinaram um plano", countIn(signals.paying)),
  ];
}
