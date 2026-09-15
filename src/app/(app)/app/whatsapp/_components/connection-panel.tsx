"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  connectWhatsAppAction,
  disconnectWhatsAppAction,
  updatePixSettingsAction,
  type ConnectWhatsAppState,
} from "@/lib/whatsapp/connection-actions"

const initialState: ConnectWhatsAppState = { error: null }

function ConnectionPanel({
  connected,
  phoneNumber,
  pixKey,
  pixCity,
  canEdit,
}: {
  connected: boolean
  phoneNumber: string | null
  pixKey: string | null
  pixCity: string | null
  canEdit: boolean
}) {
  const [state, formAction, pending] = useActionState(connectWhatsAppAction, initialState)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [pixInput, setPixInput] = React.useState(pixKey ?? "")
  const [pixCityInput, setPixCityInput] = React.useState(pixCity ?? "")
  const [savingPix, setSavingPix] = React.useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    const result = await disconnectWhatsAppAction()
    setDisconnecting(false)
    if (result.error) toast.error(result.error)
    else toast.success("WhatsApp desconectado.")
  }

  async function handleSavePix() {
    setSavingPix(true)
    const result = await updatePixSettingsAction(pixInput, pixCityInput)
    setSavingPix(false)
    if (result.error) toast.error(result.error)
    else toast.success("Dados do Pix salvos.")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          {connected ? (
            <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <XCircleIcon className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="font-medium">{connected ? `Conectado — ${phoneNumber}` : "Não conectado"}</span>
        </div>

        {connected ? (
          canEdit && (
            <Button variant="destructive" size="sm" className="mt-3" loading={disconnecting} onClick={handleDisconnect}>
              Desconectar
            </Button>
          )
        ) : (
          canEdit && (
            <form action={formAction} className="mt-4 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Você precisa ter criado seu próprio Aplicativo e Conta do WhatsApp Business no{" "}
                <span className="font-medium">Meta for Developers</span>. Cole aqui o ID do número de telefone e um
                token de acesso permanente (usuário do sistema).
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phoneNumberId">ID do número de telefone</Label>
                <Input id="phoneNumberId" name="phoneNumberId" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="accessToken">Token de acesso</Label>
                <PasswordInput id="accessToken" name="accessToken" required />
              </div>
              {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" loading={pending} className="w-full sm:w-auto">
                Conectar
              </Button>
            </form>
          )
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Dados do Pix</p>
        <p className="text-xs text-muted-foreground">
          Usados para gerar o código de pagamento (Pix Copia e Cola) nas mensagens de cobrança — o ATLAS só usa
          esses dados pra montar o código, o dinheiro vai direto pra sua conta, nunca passa pelo ATLAS.
        </p>
        {canEdit ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pixKeyInput">Chave Pix</Label>
              <Input
                id="pixKeyInput"
                value={pixInput}
                onChange={(e) => setPixInput(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                maxLength={77}
                className="max-w-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pixCityInput">Cidade</Label>
              <Input
                id="pixCityInput"
                value={pixCityInput}
                onChange={(e) => setPixCityInput(e.target.value)}
                placeholder="Nome da cidade"
                maxLength={15}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Exigido pelo padrão Pix, até 15 caracteres.</p>
            </div>
            <Button size="sm" loading={savingPix} onClick={handleSavePix} className="w-fit">
              Salvar
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <p>Chave: {pixKey ?? "Não configurada"}</p>
            <p>Cidade: {pixCity ?? "Não configurada"}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { ConnectionPanel }
