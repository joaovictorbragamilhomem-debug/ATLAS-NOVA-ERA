import * as React from "react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

// O hook useReducedMotion() da lib "motion" lê matchMedia já na primeira
// renderização do cliente, que não bate com o servidor (sempre "não
// reduzido", por não ter matchMedia). Isso não é só um aviso de hidratação:
// como o servidor manda o HTML com opacity:0 (estado inicial da animação) e
// o React não corrige atributos divergentes depois de um mismatch, quem tem
// reduced-motion ativado no SO ficava com a seção inteira invisível para
// sempre. useSyncExternalStore resolve isso do jeito que o React recomenda:
// usa getServerSnapshot (false) na hidratação e só troca pro valor real
// depois, num re-render normal.
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
export function useReducedMotionSafe(): boolean {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
}

function subscribeNever() {
  return () => {}
}
// false só durante a hidratação da página (o HTML que veio do servidor),
// true em qualquer componente montado depois — ex.: numa navegação entre
// telas do painel. Serve pra animar de entrada só o que aparece por
// navegação, sem esconder (opacity:0) o conteúdo que já veio renderizado do
// servidor até o JS carregar.
function useIsMountedAfterHydration(): boolean {
  return React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  )
}

// Animações de entrada do painel logado: desligadas na primeira carga da
// página (conteúdo aparece na hora, sem esperar JS) e para quem prefere
// menos movimento no sistema operacional.
export function useEntranceAnimationEnabled(): boolean {
  const reduceMotion = useReducedMotionSafe()
  const afterHydration = useIsMountedAfterHydration()
  return afterHydration && !reduceMotion
}
