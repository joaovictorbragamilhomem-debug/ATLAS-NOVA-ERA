import { describe, expect, it, vi, afterEach } from "vitest";
import { createMetaCloudApiProvider } from "./meta-cloud-api-provider";

const CONFIG = { phoneNumberId: "1234567890", accessToken: "test-token" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMetaCloudApiProvider", () => {
  it("sends a template message with positional body params, stripping the + from the phone", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.ABC123" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMetaCloudApiProvider(CONFIG);
    const result = await provider.sendTemplateMessage({
      to: "+5511999998888",
      templateName: "lembrete_vencimento",
      templateLanguage: "pt_BR",
      bodyParams: ["Maria", "R$ 180,00", "16/07/2026"],
    });

    expect(result).toEqual({ providerMessageId: "wamid.ABC123" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/1234567890/messages");
    expect(options.headers.Authorization).toBe("Bearer test-token");

    const body = JSON.parse(options.body);
    expect(body.to).toBe("5511999998888");
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("lembrete_vencimento");
    expect(body.template.language.code).toBe("pt_BR");
    expect(body.template.components[0].parameters).toEqual([
      { type: "text", text: "Maria" },
      { type: "text", text: "R$ 180,00" },
      { type: "text", text: "16/07/2026" },
    ]);
  });

  it("attaches the Pix code and amount to the order details button, after the body params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.PIX1" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMetaCloudApiProvider(CONFIG);
    await provider.sendTemplateMessage({
      to: "+5511999998888",
      templateName: "cobranca_pix",
      templateLanguage: "pt_BR",
      bodyParams: ["2/10"],
      pixOrderDetails: {
        referenceId: "abc123",
        itemName: "Parcela 2/10",
        amountCents: 15540,
        pixCode: "00020101021126...6304ABCD",
        merchantName: "Loja Exemplo",
        pixKey: "+5594992924743",
        pixKeyType: "PHONE",
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const [bodyComponent, button] = body.template.components;
    expect(bodyComponent).toEqual({ type: "body", parameters: [{ type: "text", text: "2/10" }] });
    expect(button.type).toBe("button");
    expect(button.sub_type).toBe("order_details");

    const order = button.parameters[0].action.order_details;
    expect(order.reference_id).toBe("abc123");
    expect(order.payment_type).toBe("br");
    expect(order.currency).toBe("BRL");
    expect(order.total_amount).toEqual({ value: 15540, offset: 100 });
    expect(order.order.subtotal).toEqual({ value: 15540, offset: 100 });
    expect(order.order.items).toEqual([
      { retailer_id: "abc123", name: "Parcela 2/10", amount: { value: 15540, offset: 100 }, quantity: 1 },
    ]);
    expect(order.payment_settings).toEqual([
      {
        type: "pix_dynamic_code",
        pix_dynamic_code: {
          code: "00020101021126...6304ABCD",
          merchant_name: "Loja Exemplo",
          key: "+5594992924743",
          key_type: "PHONE",
        },
      },
    ]);
  });

  it("returns a friendly error when the Meta API responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: "Template name does not exist" } }),
      })
    );

    const provider = createMetaCloudApiProvider(CONFIG);
    const result = await provider.sendTemplateMessage({
      to: "+5511999998888",
      templateName: "inexistente",
      templateLanguage: "pt_BR",
      bodyParams: [],
    });

    expect(result).toEqual({ error: "Template name does not exist" });
  });

  it("returns a friendly error when fetch itself fails (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    const provider = createMetaCloudApiProvider(CONFIG);
    const result = await provider.sendTextMessage({ to: "+5511999998888", body: "oi" });
    expect(result.error).toMatch(/não foi possível conectar/i);
  });
});
