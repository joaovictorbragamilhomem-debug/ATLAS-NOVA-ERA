import { ImageResponse } from "next/og";

// Sempre a mesma imagem — gera uma vez e cacheia, em vez de recalcular a
// cada instalação/atualização de ícone.
export const dynamic = "force-static";

// Ícone do manifesto (PWA) num tamanho fixo — separado do icon.tsx (aba do
// navegador) porque o manifest.ts precisa de uma URL estável e conhecida,
// não a URL gerada com hash do ícone automático do Next.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#090E17",
          color: "#2DD4A8",
          fontSize: 130,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { width: 192, height: 192 }
  );
}
