"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CalendarPlusIcon,
  CheckIcon,
  InboxIcon,
  Trash2Icon,
  RefreshCwIcon,
  MessageCircleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CpfInput, PhoneInput, CurrencyInput } from "@/components/ui/masked-input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge, type InstallmentStatus } from "@/components/ui/status-badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/ui/responsive-table"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Stepper } from "@/components/ui/stepper"
import { AnimateIn } from "@/components/ui/animate-in"
import { formatCentsToBRL } from "@/lib/masks"
import { isValidCPF } from "@/lib/validators"

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-10 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Swatch({ name, hex, on = "light" }: { name: string; hex: string; on?: "light" | "dark" }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      <div
        className="flex h-16 items-end p-2"
        style={{ backgroundColor: hex, color: on === "dark" ? "#fff" : "#101827" }}
      >
        <span className="text-xs font-medium">{name}</span>
      </div>
      <div className="bg-card px-2 py-1.5 font-mono text-xs text-muted-foreground">{hex}</div>
    </div>
  )
}

type Installment = {
  id: string
  cliente: string
  parcela: string
  vencimento: string
  valor: number
  status: InstallmentStatus
}

const installments: Installment[] = [
  { id: "1", cliente: "Maria Souza", parcela: "3/12", vencimento: "10/09/2026", valor: 25000, status: "paga" },
  { id: "2", cliente: "João Pereira", parcela: "5/6", vencimento: "11/09/2026", valor: 48000, status: "vence_hoje" },
  { id: "3", cliente: "Ana Lima", parcela: "2/10", vencimento: "02/09/2026", valor: 32000, status: "atrasada" },
  { id: "4", cliente: "Carlos Dias", parcela: "1/8", vencimento: "20/09/2026", valor: 61500, status: "a_vencer" },
  { id: "5", cliente: "Fernanda Melo", parcela: "4/4", vencimento: "15/08/2026", valor: 15000, status: "renegociada" },
  { id: "6", cliente: "Pedro Alves", parcela: "6/6", vencimento: "01/08/2026", valor: 20000, status: "estornada" },
]

const columns: ResponsiveTableColumn<Installment>[] = [
  { key: "cliente", header: "Cliente", render: (r) => r.cliente },
  { key: "parcela", header: "Parcela", render: (r) => r.parcela, hideOnMobile: true },
  { key: "vencimento", header: "Vencimento", render: (r) => r.vencimento },
  {
    key: "valor",
    header: "Valor",
    align: "right",
    render: (r) => formatCentsToBRL(r.valor),
  },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
]

export default function DesignPage() {
  const [cpf, setCpf] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [amount, setAmount] = React.useState(0)
  const [date, setDate] = React.useState<Date | undefined>()
  const [loading, setLoading] = React.useState(false)

  const cpfTouched = cpf.length === 11
  const cpfValid = !cpfTouched || isValidCPF(cpf)

  return (
    <main className="mx-auto flex max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 pb-10">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">/design</p>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold">Design system — ATLAS OBSIDIAN</h1>
        <p className="max-w-2xl text-muted-foreground">
          Todos os componentes e estados usados no site e no sistema, em um só lugar. Esta página
          não faz parte do produto — é uma referência para manter tudo consistente.
        </p>
      </header>

      <Section
        title="Cores — light"
        description="Tokens do tema claro. Os valores reais ficam em globals.css (:root / .dark) — troque o tema no toggle do header pra ver a versão dark."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <Swatch name="Fundo" hex="#F7F8FA" />
          <Swatch name="Fundo secundário" hex="#EEF1F5" />
          <Swatch name="Superfície (card)" hex="#FFFFFF" />
          <Swatch name="Texto" hex="#101827" on="dark" />
          <Swatch name="Linha" hex="#E4E8ED" />
          <Swatch name="Teal Atlas" hex="#2DD4A8" />
          <Swatch name="Teal hover" hex="#20B889" on="dark" />
          <Swatch name="Sucesso" hex="#0F7A5C" on="dark" />
          <Swatch name="Atenção" hex="#B45309" on="dark" />
          <Swatch name="Dívida" hex="#B91C1C" on="dark" />
          <Swatch name="Info" hex="#1D4ED8" on="dark" />
          <Swatch name="Roxo" hex="#6D28D9" on="dark" />
        </div>
      </Section>

      <Section title="Status das parcelas" description="Sempre cor + ícone + texto — nunca só a cor.">
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="paga" />
          <StatusBadge status="vence_hoje" />
          <StatusBadge status="atrasada" />
          <StatusBadge status="a_vencer" />
          <StatusBadge status="renegociada" />
          <StatusBadge status="estornada" />
        </div>
      </Section>

      <Section title="Tipografia" description="Geist Sans para tudo, Geist Mono para valores e variáveis.">
        <div className="flex flex-col gap-3">
          {[
            ["text-xs", "12"],
            ["text-sm", "14"],
            ["text-base", "16"],
            ["text-lg", "18"],
            ["text-xl", "20"],
            ["text-2xl", "24"],
            ["text-3xl", "32"],
            ["text-4xl", "48"],
            ["text-5xl", "64"],
          ].map(([cls, px]) => (
            <div key={cls} className="flex items-baseline gap-4">
              <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{px}</span>
              <span className={cls}>Cobrar com respeito, no horário certo</span>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-4 border-t border-border pt-4">
            <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">mono</span>
            <span className="font-mono text-lg tabular-nums">{"{{valor_parcela}}  R$ 1.234,56"}</span>
          </div>
        </div>
      </Section>

      <Section title="Botões" description="primary, secondary, ghost e destructive — 44px no celular, 40px no desktop.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled>
              Desabilitado
            </Button>
            <Button variant="primary" loading={loading} onClick={() => setLoading((v) => !v)}>
              {loading ? "Carregando" : "Clique para simular loading"}
            </Button>
            <Button variant="primary" size="sm">
              Pequeno
            </Button>
            <Button variant="primary" size="lg">
              Grande
            </Button>
            <Button variant="secondary" size="icon" aria-label="Atualizar">
              <RefreshCwIcon />
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Campos de formulário" description="Inputs com máscara para CPF, telefone e dinheiro (sempre em centavos).">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="design-cpf">CPF</Label>
            <CpfInput
              id="design-cpf"
              value={cpf}
              onValueChange={setCpf}
              aria-invalid={!cpfValid}
            />
            {!cpfValid && <p className="text-xs text-destructive">CPF inválido — confira os números.</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="design-phone">WhatsApp</Label>
            <PhoneInput id="design-phone" value={phone} onValueChange={setPhone} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="design-amount">Valor da parcela</Label>
            <CurrencyInput id="design-amount" value={amount} onValueChange={setAmount} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Vencimento</Label>
            <DatePicker value={date} onValueChange={setDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Periodicidade</Label>
            <Select defaultValue="monthly">
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string) =>
                    ({ weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal" })[value]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="design-notes">Observações</Label>
            <Textarea id="design-notes" placeholder="Opcional" />
          </div>
        </div>
      </Section>

      <Section title="Cartão (Card)">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Contrato #0042</CardTitle>
            <CardDescription>Maria Souza · 12 parcelas mensais</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor emprestado</span>
              <span className="tabular-nums">{formatCentsToBRL(300000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Próxima parcela</span>
              <span className="tabular-nums">{formatCentsToBRL(25000)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full">
              Ver detalhes
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Tabela responsiva" description="Vira lista de cartões no celular — redimensione a janela para ver.">
        <ResponsiveTable columns={columns} rows={installments} getRowKey={(r) => r.id} />
      </Section>

      <Section title="Dialog e Sheet">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="secondary" />}>Abrir modal</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar estorno</DialogTitle>
                <DialogDescription>
                  Essa ação não pode ser desfeita. A parcela voltará para o status anterior.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>Cancelar</DialogClose>
                <Button variant="destructive">Estornar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger render={<Button variant="secondary" />}>Abrir painel</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Maria Souza</SheetTitle>
                <SheetDescription>Ficha rápida do cliente</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span>(11) 91234-5678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contrato ativo</span>
                  <span>#0042</span>
                </div>
              </div>
              <SheetFooter>
                <Button variant="primary" className="w-full">
                  <MessageCircleIcon /> Enviar mensagem
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success("Pagamento registrado.")}>
            Sucesso
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Não foi possível salvar.")}>
            Erro
          </Button>
          <Button variant="secondary" onClick={() => toast("Mensagem agendada para amanhã às 9h.")}>
            Informação
          </Button>
        </div>
      </Section>

      <Section title="Estado vazio (EmptyState)">
        <EmptyState
          icon={InboxIcon}
          title="Nenhuma conversa ainda"
          description="Quando um cliente responder uma mensagem, ela aparece aqui."
          action={
            <Button variant="secondary" size="sm">
              <CalendarPlusIcon /> Ver automações
            </Button>
          }
        />
      </Section>

      <Section title="Skeleton (carregando)">
        <div className="flex max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title="Stepper" description="Usado nos primeiros passos e em fluxos de várias etapas.">
        <Stepper
          steps={["Conectar WhatsApp", "Cadastrar cliente", "Criar contrato", "Ligar cobrança"]}
          currentStep={1}
        />
      </Section>

      <Section title="Movimento" description="150–250ms, ease-out. Respeita prefers-reduced-motion.">
        <AnimateIn>
          <Card className="max-w-sm">
            <CardContent className="flex items-center gap-2 pt-4 text-sm">
              <CheckIcon className="size-4 text-primary" />
              Esta mensagem chega assim — recarregue a página para ver de novo.
            </CardContent>
          </Card>
        </AnimateIn>
      </Section>

      <Section title="Excluir cliente" description="Ação destrutiva com confirmação — nunca é feita com um clique só.">
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" className="self-start" />}>
            <Trash2Icon /> Excluir cliente
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Maria Souza?</DialogTitle>
              <DialogDescription>
                Isso remove o cadastro do cliente. Contratos e parcelas continuam no histórico.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancelar</DialogClose>
              <Button variant="destructive">Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>
    </main>
  )
}
