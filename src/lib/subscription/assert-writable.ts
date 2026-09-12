import { getSubscriptionStatus } from "@/lib/auth/subscription-status";

// Teste acabou ou pagamento atrasou: a conta vê tudo, mas não cria nem
// edita nada até assinar. Toda ação de escrita deve chamar isso primeiro.
export async function assertOrganizationIsWritable(organizationId: string): Promise<string | null> {
  const subscription = await getSubscriptionStatus(organizationId);
  if (subscription?.isReadOnly) {
    return "Sua conta está em modo somente leitura (teste grátis terminou ou pagamento pendente). Assine para voltar a criar e editar.";
  }
  return null;
}
