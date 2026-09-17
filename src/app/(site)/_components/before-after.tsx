"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2Icon,
  CheckIcon,
  MessageCircleIcon,
  UsersIcon,
  CalendarDaysIcon,
  FileTextIcon,
  HistoryIcon,
  BellIcon,
  ArrowRightIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Reveal } from "@/components/ui/reveal"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCentsToBRL } from "@/lib/masks"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

// Dispara uma vez quando o elemento entra na tela — usado pelos dois
// widgets "vivos" desta seção (status da parcela e painel do dia). Só roda
// dentro de um efeito (client-only, depois da hidratação), então não há
// risco do mismatch servidor/cliente que a timeline do Hero precisa evitar
// com useSyncExternalStore.
function useInViewOnce<T extends Element>(threshold = 0.4) {
  const ref = React.useRef<T>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, threshold])

  return { ref, inView }
}

// Lê prefers-reduced-motion sem causar mismatch de hidratação (mesmo
// motivo documentado em hero-demo/use-hero-demo.ts): o valor aqui afeta
// diretamente o que é renderizado (fase final do widget), não só se um
// timer roda — por isso precisa do getServerSnapshot estável, e não de um
// setState dentro do efeito.
function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
function getReducedMotionServerSnapshot() {
  return false
}
function useReducedMotionSafe(): boolean {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
}

function ProblemCopy() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 rounded-xl border border-border bg-card p-6">
      <p className="text-base font-semibold text-foreground">
        Desorganização financeira não é só estresse — é dinheiro que deixa de entrar.
      </p>
      <p className="text-sm text-muted-foreground">
        Parcela atrasa e ninguém percebe a tempo. Cliente esquece porque também ninguém lembrou
        ele. E cobrar sobra pra você, com seu número e seu nome — até virar “aquele que fica
        cobrando”.
      </p>
      <p className="text-sm text-muted-foreground">
        O Atlas assume essa parte: os lembretes saem sozinhos pelo WhatsApp, como um contato
        comercial da empresa — não o seu número pessoal.
      </p>
      <p className="text-sm text-muted-foreground">
        Você para de correr atrás de gente e volta a gastar seu tempo no que importa: o negócio.
      </p>
    </div>
  )
}

const ORGANIZE_STEPS = [
  "Cliente cadastrado",
  "Contrato ativo",
  "3 parcelas acompanhadas",
  "Próxima cobrança em 2 dias",
]

// Em vez de listar benefícios em prosa, mostra o próprio painel se
// preenchendo — a ideia é o produto se explicar sozinho em vez de um
// parágrafo explicando o produto.
function AtlasOrganizesPanel() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 rounded-xl border border-primary/15 bg-card p-6">
      <p className="text-sm font-semibold text-foreground">O Atlas organiza por você</p>
      <div className="flex flex-col gap-2.5">
        {ORGANIZE_STEPS.map((step, index) => (
          <Reveal
            key={step}
            delay={index * 0.15}
            y={8}
            className="flex items-center gap-2.5 text-sm font-medium text-foreground"
          >
            <CheckCircle2Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {step}
          </Reveal>
        ))}
      </div>
      <Reveal
        delay={0.75}
        y={8}
        className="mt-1 flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success"
      >
        <MessageCircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
        WhatsApp → lembrete agendado
        <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
      </Reveal>
    </div>
  )
}

const OVERDUE_AMOUNT_CENTS = 34000

// Conta a história de uma parcela específica (atrasada → lembrete → paga)
// uma vez, quando o card entra na tela — sem loop infinito, porque este é
// um widget de apoio, não o protagonista da página como o mockup do Hero.
function OverdueFlowDemo() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  const reducedMotion = useReducedMotionSafe()
  const [phase, setPhase] = React.useState<0 | 1 | 2>(0)

  React.useEffect(() => {
    if (!inView || reducedMotion) return
    const t1 = setTimeout(() => setPhase(1), 900)
    const t2 = setTimeout(() => setPhase(2), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [inView, reducedMotion])

  const effectivePhase = reducedMotion ? 2 : phase
  const paid = effectivePhase === 2

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-[opacity,transform] duration-500 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">Parcela em atraso</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Fernanda Melo</span>
          <span className="text-xs text-muted-foreground">Parcela 3/6</span>
        </div>
        <span className="relative flex h-5 min-w-24 items-center justify-end">
          <span
            className={cn(
              "absolute right-0 text-sm font-bold tabular-nums text-danger transition-[opacity,transform] duration-300 ease-out",
              paid ? "scale-95 opacity-0" : "scale-100 opacity-100"
            )}
          >
            {formatCentsToBRL(OVERDUE_AMOUNT_CENTS)}
          </span>
          <span
            className={cn(
              "absolute right-0 flex items-center gap-1 text-sm font-bold text-success transition-[opacity,transform] duration-300 ease-out",
              paid ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
            style={{ transitionDelay: paid ? "180ms" : "0ms" }}
          >
            <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
            Recebido
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge status={paid ? "paga" : "atrasada"} />
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-[opacity,transform] duration-300 ease-out",
            effectivePhase >= 1 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
        >
          <MessageCircleIcon className="size-3 shrink-0" aria-hidden="true" />
          Lembrete enviado
        </span>
      </div>
    </div>
  )
}

const SNAPSHOT_ROWS: { label: string; cents: number; tone: "default" | "danger" | "success" }[] = [
  { label: "A receber", cents: 845000, tone: "default" },
  { label: "Atrasado", cents: 128000, tone: "danger" },
  { label: "Recebido", cents: 392000, tone: "success" },
]

function useCountUp(target: number, active: boolean, durationMs = 900) {
  const reducedMotion = useReducedMotionSafe()
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (!active || reducedMotion) return
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reducedMotion, target, durationMs])

  return reducedMotion ? target : value
}

function SnapshotRow({
  label,
  cents,
  tone,
  active,
}: {
  label: string
  cents: number
  tone: "default" | "danger" | "success"
  active: boolean
}) {
  const value = useCountUp(cents, active)
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success"
        )}
      >
        {formatCentsToBRL(value)}
      </span>
    </div>
  )
}

// Painel "Hoje" inspirado no OkCredit: números entrando com contagem, em
// vez de uma frase explicando que "você vê o que tem a receber". Deixado
// explicitamente como interface ilustrativa — não é estatística real.
function TodaySnapshot() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-[opacity,transform] duration-500 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">Hoje</p>
      <div className="flex flex-col gap-2">
        {SNAPSHOT_ROWS.map((row) => (
          <SnapshotRow key={row.label} {...row} active={inView} />
        ))}
      </div>
      <p className="text-[0.65rem] text-muted-foreground/70">Interface ilustrativa — não são dados reais.</p>
    </div>
  )
}

const BENEFITS: { icon: LucideIcon; problem: string; solution: string; span: 1 | 2 | 3 }[] = [
  {
    icon: BellIcon,
    problem: "Cliente atrasou e ninguém percebeu a tempo.",
    solution:
      "O Atlas identifica a parcela vencida e manda o lembrete pelo WhatsApp sozinho — você só acompanha se ele respondeu.",
    span: 2,
  },
  {
    icon: UsersIcon,
    problem: "Cada um da equipe guarda a informação em um lugar diferente.",
    solution: "Clientes, contratos e parcelas ficam no mesmo painel, pra qualquer um do time ver.",
    span: 1,
  },
  {
    icon: CalendarDaysIcon,
    problem: "Você não sabe quem te deve hoje.",
    solution: "Veja o que venceu, o que vence hoje e o que já foi pago, sem abrir planilha.",
    span: 1,
  },
  {
    icon: MessageCircleIcon,
    problem: "Cobrar cliente por cliente, na mão, todo dia.",
    solution: "Os lembretes saem sozinhos, no horário certo — sem você precisar lembrar.",
    span: 1,
  },
  {
    icon: HistoryIcon,
    problem: "Cliente diz que já pagou e ninguém acha o comprovante.",
    solution: "O histórico de cada pagamento fica registrado e acessível na hora.",
    span: 1,
  },
  {
    icon: FileTextIcon,
    problem: "Planilha, caderno e WhatsApp pessoal — tudo espalhado.",
    solution: "Contrato, cobrança e conversa no mesmo lugar, sem misturar com seu número pessoal.",
    span: 3,
  },
]

const SPAN_CLASS: Record<1 | 2 | 3, string> = {
  1: "",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
}

function BenefitCard({ icon: Icon, problem, solution, span, delay }: (typeof BENEFITS)[number] & { delay: number }) {
  const wide = span > 1
  return (
    <Reveal
      delay={delay}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md",
        wide && "sm:flex-row sm:items-start sm:gap-5",
        SPAN_CLASS[span]
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4.5" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{problem}</p>
        <p className="text-sm text-muted-foreground">{solution}</p>
      </div>
    </Reveal>
  )
}

function BenefitGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {BENEFITS.map((benefit, index) => (
        <BenefitCard key={benefit.problem} {...benefit} delay={Math.min(index * 0.06, 0.3)} />
      ))}
    </div>
  )
}

const BEFORE_ITEMS = ["Planilhas soltas", "Caderno de anotações", "WhatsApp pessoal", "Cobrança manual", "Informação espalhada"]
const AFTER_ITEMS = ["Clientes centralizados", "Contratos organizados", "Parcelas em dia", "Cobrança automática", "Histórico à mão"]

function TransformationStrip() {
  return (
    <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
      <Reveal className="flex-1 rounded-xl border border-border bg-muted/40 p-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Antes</p>
        <ul className="flex flex-col gap-2">
          {BEFORE_ITEMS.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.1} className="flex justify-center">
        <ArrowRightIcon className="size-5 rotate-90 text-muted-foreground lg:rotate-0" aria-hidden="true" />
      </Reveal>

      <Reveal delay={0.15} className="flex justify-center lg:order-none">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          ATLAS
        </span>
      </Reveal>

      <Reveal delay={0.2} className="flex justify-center">
        <ArrowRightIcon className="size-5 rotate-90 text-muted-foreground lg:rotate-0" aria-hidden="true" />
      </Reveal>

      <Reveal delay={0.25} className="flex-1 rounded-xl border border-primary/15 bg-card p-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Com o Atlas</p>
        <ul className="flex flex-col gap-2">
          {AFTER_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckIcon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}

function BeforeAfter() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Chega de juntar as pontas</h2>
        <p className="mt-2 text-muted-foreground">
          Tudo o que hoje está espalhado — caderno, planilha, mensagens soltas — passa a morar no
          mesmo sistema.
        </p>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <Reveal x={-24} className="h-full">
          <ProblemCopy />
        </Reveal>

        <Reveal delay={0.15} className="hidden justify-center lg:flex">
          <span className="text-sm font-medium text-muted-foreground">→</span>
        </Reveal>

        <Reveal x={24} delay={0.25} className="h-full">
          <AtlasOrganizesPanel />
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TodaySnapshot />
        <OverdueFlowDemo />
      </div>

      <div className="mt-14">
        <BenefitGrid />
      </div>

      <div className="mt-14">
        <TransformationStrip />
      </div>

      <Reveal delay={0.1} className="mt-12 flex justify-center">
        <Button size="lg" variant="secondary" nativeButton={false} render={<Link href="/app" prefetch={false} />}>
          Testar grátis por 7 dias
        </Button>
      </Reveal>
    </section>
  )
}

export { BeforeAfter }
