// Gera um slug de URL a partir do nome da empresa (ex.: "Crédito da Vila" ->
// "credito-da-vila"), para o link público /c/[slug] da ficha de cadastro.
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
