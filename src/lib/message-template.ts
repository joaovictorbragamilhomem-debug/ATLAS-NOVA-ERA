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

// A Meta não aceita texto livre em mensagem por iniciativa da empresa — só
// modelo aprovado, com parâmetros posicionais ({{1}}, {{2}}...). Por isso,
// além de renderizar o texto (para mostrar na tela), também precisamos dos
// valores na mesma ordem em que as variáveis aparecem no nosso modelo, para
// mandar como os parâmetros posicionais do modelo espelhado na Meta.
export function renderTemplateToPositionalParams(body: string, variables: TemplateVariables): string[] {
  return extractTemplateVariables(body).map((key) => variables[key] ?? "");
}

// As variáveis que o motor de cobrança vai suportar de verdade (Fase 5).
export const KNOWN_TEMPLATE_VARIABLES = [
  "nome",
  "empresa",
  "valor_parcela",
  "numero_parcela",
  "vencimento",
  "dias_atraso",
  "dias_para_vencer",
  "valor_atualizado",
  "saldo_restante",
  "chave_pix",
  "pix_copia_cola",
  "atendente",
] as const;
