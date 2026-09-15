"use client"

import * as React from "react"

// Timeline de ~9s (3 fases de 3s) que conta a história do produto: registrar
// a venda fiado, cobrar automático no WhatsApp e receber no Pix. Os tempos
// internos (botão pressionado, WhatsApp abrindo, confirmação de envio) são
// setTimeouts dentro de cada fase, coreografados como uma sequência única —
// não como um conjunto de booleans soltos.
const PHASE_MS = 3000
const RESET_MS = 420
const BTN_DOWN_MS = 340
const WA_OPEN_DELAY_MS = 320
const WA_SENT_DELAY_MS = 1150
const HOVER_SAFETY_MS = 5000

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

type DemoPhase = 0 | 1 | 2

type HeroDemoState = {
  phase: DemoPhase
  isResetting: boolean
  isBtnDown: boolean
  isWaOpen: boolean
  isWaSent: boolean
}

const OPEN_STATE: HeroDemoState = {
  phase: 0,
  isResetting: false,
  isBtnDown: false,
  isWaOpen: false,
  isWaSent: false,
}

const SETTLED_STATE: HeroDemoState = {
  phase: 2,
  isResetting: false,
  isBtnDown: false,
  isWaOpen: false,
  isWaSent: false,
}

type HeroDemoApi = HeroDemoState & {
  onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void
}

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

// Lê a preferência de reduced-motion sem quebrar a hidratação: resolver o
// valor real já na primeira renderização do cliente (como o hook
// useReducedMotion da lib "motion" faz) funciona bem sem SSR, mas aqui causa
// um mismatch entre servidor (sem matchMedia, sempre "false") e cliente — e
// o React avisa "won't be patched up" e nunca corrige os atributos depois,
// travando o Hero no estado errado pra sempre. useSyncExternalStore resolve
// isso da forma que o próprio React recomenda: usa getServerSnapshot (false)
// na hidratação e só troca pro valor real depois, num re-render normal — e,
// de brinde, reage se o usuário mudar a preferência do SO com a página já
// aberta (o hook da lib "motion" não faz isso, é só uma leitura na montagem).
function useReducedMotionSafe(): boolean {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
}

// Se o visitante prefere menos movimento, a timeline nem começa: mostramos
// direto o estado final (pagamento recebido, saldo zerado) — nenhuma
// informação do Hero depende da animação rodando.
function useHeroDemo(): HeroDemoApi {
  const reducedMotion = useReducedMotionSafe()
  const [state, setState] = React.useState<HeroDemoState>(OPEN_STATE)

  const phaseRef = React.useRef<DemoPhase>(0)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const timeoutsRef = React.useRef<ReturnType<typeof setTimeout>[]>([])
  const safetyRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearTransientTimers = React.useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const runPhase = React.useCallback(
    (next: DemoPhase) => {
      phaseRef.current = next
      clearTransientTimers()

      if (next === 0) {
        // Reinício suave: some por um instante (is-resetting) antes de
        // reentrar com a mesma animação de "peso" da fase 1, em vez de um
        // corte seco de volta ao início.
        setState({ phase: 0, isResetting: true, isBtnDown: false, isWaOpen: false, isWaSent: false })
        timeoutsRef.current.push(
          setTimeout(() => setState((s) => ({ ...s, isResetting: false })), RESET_MS)
        )
      } else if (next === 1) {
        setState({ phase: 1, isResetting: false, isBtnDown: true, isWaOpen: false, isWaSent: false })
        timeoutsRef.current.push(
          setTimeout(() => setState((s) => ({ ...s, isBtnDown: false })), BTN_DOWN_MS),
          setTimeout(() => setState((s) => ({ ...s, isWaOpen: true })), WA_OPEN_DELAY_MS),
          setTimeout(() => setState((s) => ({ ...s, isWaSent: true })), WA_SENT_DELAY_MS)
        )
      } else {
        setState((s) => ({ ...s, phase: 2, isWaOpen: false }))
      }
    },
    [clearTransientTimers]
  )

  const startLoop = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (safetyRef.current) clearTimeout(safetyRef.current)
    intervalRef.current = setInterval(() => {
      runPhase(((phaseRef.current + 1) % 3) as DemoPhase)
    }, PHASE_MS)
  }, [runPhase])

  React.useEffect(() => {
    if (reducedMotion) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (safetyRef.current) clearTimeout(safetyRef.current)
      clearTransientTimers()
      return
    }

    phaseRef.current = 0
    startLoop()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (safetyRef.current) clearTimeout(safetyRef.current)
      clearTransientTimers()
    }
  }, [reducedMotion, startLoop, clearTransientTimers])

  // Pausa enquanto o visitante observa o mockup; a rede de segurança de 5s
  // retoma o loop mesmo se o pointerleave não disparar (ex.: rolou a página
  // com o dedo sobre o celular, em vez de sair pela borda).
  const onPointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || event.pointerType === "touch") return
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (safetyRef.current) clearTimeout(safetyRef.current)
      safetyRef.current = setTimeout(startLoop, HOVER_SAFETY_MS)
    },
    [reducedMotion, startLoop]
  )

  const onPointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || event.pointerType === "touch") return
      startLoop()
    },
    [reducedMotion, startLoop]
  )

  const effectiveState = reducedMotion ? SETTLED_STATE : state

  return { ...effectiveState, onPointerEnter, onPointerLeave }
}

export { useHeroDemo, type DemoPhase, type HeroDemoApi }
