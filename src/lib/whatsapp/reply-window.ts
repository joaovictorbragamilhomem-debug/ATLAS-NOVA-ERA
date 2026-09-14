const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

// A Meta só deixa mandar texto livre até 24h depois da última mensagem
// que o cliente mandou — depois disso, só reiniciando com um modelo
// aprovado. Sem histórico de mensagem recebida, nunca está dentro da janela.
export function isWithinReplyWindow(lastInboundAt: string | null, now: Date = new Date()): boolean {
  if (!lastInboundAt) return false;
  const elapsed = now.getTime() - new Date(lastInboundAt).getTime();
  return elapsed >= 0 && elapsed < REPLY_WINDOW_MS;
}
