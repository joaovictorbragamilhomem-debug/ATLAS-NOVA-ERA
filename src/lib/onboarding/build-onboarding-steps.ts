export type OnboardingRole = "owner" | "manager" | "operator";

export type OnboardingStepId = "customer" | "contract" | "whatsapp";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  done: boolean;
  // Depends on an earlier step (a contract needs a customer to attach to).
  locked: boolean;
  href: string | null;
  ctaLabel: string;
};

export type OnboardingInput = {
  role: OnboardingRole;
  firstCustomerId: string | null;
  hasContract: boolean;
  whatsappConnected: boolean;
};

// Only lists steps the role can actually perform (mirrors the RLS policies:
// any member creates customers, owner/manager create contracts, only the
// owner connects WhatsApp), so nobody is pointed at a page that will refuse them.
export function buildOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const { role, firstCustomerId, hasContract, whatsappConnected } = input;
  const hasCustomer = firstCustomerId !== null;

  const steps: OnboardingStep[] = [
    {
      id: "customer",
      title: "Cadastre seu primeiro cliente",
      description: "Nome, CPF e WhatsApp já bastam. O resto você completa depois.",
      done: hasCustomer,
      locked: false,
      href: "/app/clientes/novo",
      ctaLabel: "Cadastrar cliente",
    },
  ];

  if (role !== "operator") {
    steps.push({
      id: "contract",
      title: "Crie o primeiro contrato",
      description: "Informe valor, parcelas e vencimento. O ATLAS gera o carnê e acompanha cada parcela.",
      done: hasContract,
      locked: !hasContract && !hasCustomer,
      href: hasCustomer ? `/app/clientes/${firstCustomerId}/contratos/novo` : null,
      ctaLabel: "Criar contrato",
    });
  }

  if (role === "owner") {
    steps.push({
      id: "whatsapp",
      title: "Conecte o WhatsApp",
      description: "Para avisar os clientes do vencimento e cobrar atrasos automaticamente.",
      done: whatsappConnected,
      locked: false,
      href: "/app/whatsapp",
      ctaLabel: "Conectar WhatsApp",
    });
  }

  return steps;
}

export function isOnboardingComplete(steps: OnboardingStep[]): boolean {
  return steps.every((step) => step.done);
}
