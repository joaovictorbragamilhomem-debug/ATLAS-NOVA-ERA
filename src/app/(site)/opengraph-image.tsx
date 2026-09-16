import { ImageResponse } from "next/og";

export const alt = "ATLAS NOVA ERA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 96,
          background: "#090E17",
          color: "#F4F7FB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 32,
            color: "#2DD4A8",
            fontWeight: 600,
          }}
        >
          ATLAS NOVA ERA
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 600, lineHeight: 1.15 }}>
          Cobrança no automático, direto no WhatsApp
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#98A4B3" }}>
          Clientes, contratos e parcelas organizados num só lugar.
        </div>
      </div>
    ),
    { ...size }
  );
}
