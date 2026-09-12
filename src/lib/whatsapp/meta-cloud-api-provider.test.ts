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
