export type TemplateVariables = Record<string, string>;

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function renderTemplate(body: string, variables: TemplateVariables): string {
  return body.replace(VARIABLE_PATTERN, (match, key: string) => {
    return key in variables ? variables[key] : match;
  });
}

export function extractTemplateVariables(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1]);
  }
  return Array.from(found);
}

// As variáveis que o motor de cobrança vai suportar de verdade (Fase 5).
export const KNOWN_TEMPLATE_VARIABLES = [
  "nome",
  "empresa",
  "valor_parcela",
  "numero_parcela",
  "vencimento",
  "dias_atraso",
  "valor_atualizado",
  "saldo_restante",
  "chave_pix",
  "atendente",
] as const;
