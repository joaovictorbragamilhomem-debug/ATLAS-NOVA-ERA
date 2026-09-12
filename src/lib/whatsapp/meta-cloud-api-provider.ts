import type {
  SendMessageResult,
  SendTemplateMessageParams,
  SendTextMessageParams,
  WhatsAppProvider,
} from "./provider";

// Versão fixa da Graph API — atualizar aqui, deliberadamente, quando a Meta
// aposentar essa versão (nunca "latest" solto).
const META_GRAPH_API_VERSION = "v21.0";

export type MetaCloudApiConfig = {
  phoneNumberId: string;
  accessToken: string;
};

// A Meta espera o número sem "+" nem zeros à esquerda depois do DDI.
function toMetaPhoneFormat(e164: string): string {
  return e164.replace(/^\+/, "");
}

export function createMetaCloudApiProvider(config: MetaCloudApiConfig): WhatsAppProvider {
  async function callMetaApi(body: unknown): Promise<SendMessageResult> {
    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch {
      return { error: "Não foi possível conectar com o WhatsApp (Meta). Tente novamente." };
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return { error: data?.error?.message ?? `Erro ${res.status} ao enviar mensagem pelo WhatsApp.` };
    }

    const messageId = data?.messages?.[0]?.id;
    if (!messageId) return { error: "Resposta inesperada da Meta ao enviar a mensagem." };

    return { providerMessageId: messageId };
  }

  return {
    async sendTemplateMessage({ to, templateName, templateLanguage, bodyParams }: SendTemplateMessageParams) {
      return callMetaApi({
        messaging_product: "whatsapp",
        to: toMetaPhoneFormat(to),
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components:
            bodyParams.length > 0
              ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }]
              : undefined,
        },
      });
    },

    async sendTextMessage({ to, body }: SendTextMessageParams) {
      return callMetaApi({
        messaging_product: "whatsapp",
        to: toMetaPhoneFormat(to),
        type: "text",
        text: { body },
      });
    },
  };
}
