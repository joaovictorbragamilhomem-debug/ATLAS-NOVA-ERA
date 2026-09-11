// A API da Asaas trabalha em reais (com casas decimais), não em centavos.
// Aqui é a única fronteira onde saímos do "tudo em centavos" — sempre
// convertendo com cuidado para não sofrer com arredondamento de float.
export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function reaisToCents(value: number): number {
  return Math.round(value * 100);
}
