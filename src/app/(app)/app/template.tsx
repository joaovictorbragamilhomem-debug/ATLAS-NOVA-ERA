import { PageTransition } from "@/components/ui/page-transition"

// Ao contrário do layout, o template é remontado a cada navegação entre
// telas do painel — é o que faz o fade de entrada rodar em cada uma.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
