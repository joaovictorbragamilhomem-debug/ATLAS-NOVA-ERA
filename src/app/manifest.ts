import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Atlas",
    description: "Organize clientes, contratos e parcelas, e deixe a cobrança pelo WhatsApp acontecer sozinha.",
    // Quem instala o app vai usá-lo pra trabalhar no painel todo dia, não
    // pra ver o site de vendas de novo.
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#0B1210",
    theme_color: "#0B1210",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
