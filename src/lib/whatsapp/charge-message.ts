// Messages the lender sends from their own WhatsApp (wa.me link), for
// subscribers without the Meta Cloud API connected. Built from the same
// variables as the automated collection (see buildVariables in enqueue.ts).

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function daysLabel(days: number): string {
  return days === 1 ? "1 dia" : `${days} dias`;
}

export function buildChargeMessage(variables: Record<string, string>, customerName: string, withPixCode: boolean): string {
  const greeting = `Olá, ${firstName(customerName)}!`;
  const daysLate = Number(variables.dias_atraso ?? 0);
  const daysToDue = Number(variables.dias_para_vencer ?? 0);

  let body: string;
  if (daysLate > 0) {
    body =
      `A parcela ${variables.numero_parcela} do seu crediário com ${variables.empresa} venceu em ${variables.vencimento} ` +
      `e está em aberto há ${daysLabel(daysLate)}. Valor atualizado: ${variables.saldo_restante}.`;
  } else if (daysToDue === 0) {
    body =
      `Passando para lembrar que a parcela ${variables.numero_parcela} do seu crediário com ${variables.empresa}, ` +
      `no valor de ${variables.saldo_restante}, vence hoje (${variables.vencimento}).`;
  } else {
    body =
      `Passando para lembrar que a parcela ${variables.numero_parcela} do seu crediário com ${variables.empresa}, ` +
      `no valor de ${variables.saldo_restante}, vence em ${variables.vencimento}.`;
  }

  const pixLine = withPixCode
    ? "\n\nVou te mandar o código Pix na próxima mensagem — é só copiar e colar no app do seu banco (Pix Copia e Cola)."
    : "";

  return `${greeting} ${body}${pixLine}\n\nSe já pagou, desconsidere esta mensagem.`;
}

export function buildWaMeUrl(phoneE164: string, text: string): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
