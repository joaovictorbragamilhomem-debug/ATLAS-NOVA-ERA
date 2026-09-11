import { SITE_URL, SITE_NAME } from "@/lib/site";

function layout(title: string, bodyHtml: string, ctaHref?: string, ctaLabel?: string): string {
  return `
<div style="background:#F7F7F4;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0B1210;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid #E6E6E1;border-radius:16px;padding:32px;">
    <p style="font-size:14px;font-weight:600;color:#047857;margin:0 0 24px;">${SITE_NAME}</p>
    <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#333;">${bodyHtml}</div>
    ${
      ctaHref
        ? `<p style="margin-top:24px;">
             <a href="${ctaHref}" style="display:inline-block;background:#047857;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;">${ctaLabel}</a>
           </p>`
        : ""
    }
  </div>
</div>`;
}

export function welcomeEmail(params: { organizationName: string }) {
  return {
    subject: `Bem-vindo ao ${SITE_NAME}`,
    html: layout(
      `Sua conta está pronta, ${params.organizationName}!`,
      `<p>Seu teste grátis de 7 dias já começou — sem cartão de crédito.</p>
       <p>Cadastre seus primeiros clientes, crie um contrato e conecte o WhatsApp para ver a cobrança acontecer sozinha.</p>`,
      `${SITE_URL}/app`,
      "Entrar no painel"
    ),
  };
}

export function trialEndingSoonEmail(params: { daysLeft: number }) {
  return {
    subject: `Seu teste grátis termina em ${params.daysLeft} dias`,
    html: layout(
      `Faltam ${params.daysLeft} dias do seu teste grátis`,
      `<p>Depois desse prazo, sua conta entra em modo somente leitura — você continua vendo tudo, mas não consegue criar ou editar nada até assinar.</p>
       <p>Escolha um plano para continuar sem interrupção.</p>`,
      `${SITE_URL}/app/assinatura`,
      "Ver planos"
    ),
  };
}

export function paymentConfirmedEmail() {
  return {
    subject: "Pagamento confirmado",
    html: layout(
      "Recebemos seu pagamento",
      `<p>Sua assinatura está ativa. Obrigado por confiar no ${SITE_NAME}.</p>`,
      `${SITE_URL}/app`,
      "Ir para o painel"
    ),
  };
}

export function paymentFailedEmail() {
  return {
    subject: "Não conseguimos confirmar seu pagamento",
    html: layout(
      "Seu pagamento não foi confirmado",
      `<p>Isso pode acontecer por vários motivos (cartão recusado, boleto vencido, etc). Sua conta fica em modo somente leitura até regularizar.</p>`,
      `${SITE_URL}/app/assinatura`,
      "Regularizar assinatura"
    ),
  };
}
