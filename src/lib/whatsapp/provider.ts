// Abstração trocável: hoje só existe o adaptador da Meta Cloud API
// (meta-cloud-api-provider.ts), mas todo o resto do sistema (fila, cron,
// automação) fala só com essa interface — trocar de provedor no futuro não
// deveria exigir mexer em mais nada além de um novo arquivo aqui dentro.

import type { PixKeyType } from "@/lib/pix/pix-key";

export type WhatsAppTemplateParam = string;

// Filled into the "Review and pay" button of an order details template.
export type PixOrderDetails = {
  referenceId: string;
  itemName: string;
  amountCents: number;
  pixCode: string;
  merchantName: string;
  pixKey: string;
  pixKeyType: PixKeyType;
};

export type SendTemplateMessageParams = {
  to: string; // E.164, ex.: +5511999998888
  templateName: string;
  templateLanguage: string; // ex.: "pt_BR"
  bodyParams: WhatsAppTemplateParam[]; // valores posicionais, na ordem do modelo
  pixOrderDetails?: PixOrderDetails;
};

export type SendTextMessageParams = {
  to: string;
  body: string;
};

export type SendMessageResult = { providerMessageId: string; error?: undefined } | { providerMessageId?: undefined; error: string };

export interface WhatsAppProvider {
  // Mensagem por iniciativa da empresa (fora da janela de 24h de conversa)
  // — a Meta só aceita isso como um modelo pré-aprovado.
  sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult>;

  // Texto livre — só funciona dentro da janela de 24h após o cliente
  // mandar mensagem (ex.: resposta de um atendente). Não é usado pelo
  // motor de automação, mas fica pronto para a tela de conversas.
  sendTextMessage(params: SendTextMessageParams): Promise<SendMessageResult>;
}
