import Papa from "papaparse";
import { isValidCPF } from "@/lib/validators";
import { onlyDigits, phoneDigitsToE164BR } from "@/lib/masks";

export type ParsedCustomerRow = {
  line: number;
  name: string;
  cpf: string;
  whatsapp: string; // E.164, já convertido
  email: string | null;
  cep: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  notes: string | null;
  tags: string[];
  error: string | null;
};

type CustomerFieldKey =
  | "name"
  | "cpf"
  | "whatsapp"
  | "email"
  | "cep"
  | "addressStreet"
  | "addressNumber"
  | "addressComplement"
  | "addressDistrict"
  | "addressCity"
  | "addressState"
  | "notes"
  | "tags";

// Aceita variações comuns de nome de coluna (com/sem acento, maiúsculas)
// para não travar em detalhes de como a pessoa exportou a planilha.
const HEADER_ALIASES: Record<string, CustomerFieldKey> = {
  nome: "name",
  cpf: "cpf",
  whatsapp: "whatsapp",
  telefone: "whatsapp",
  celular: "whatsapp",
  email: "email",
  "e-mail": "email",
  cep: "cep",
  endereco: "addressStreet",
  rua: "addressStreet",
  numero: "addressNumber",
  complemento: "addressComplement",
  bairro: "addressDistrict",
  cidade: "addressCity",
  estado: "addressState",
  uf: "addressState",
  observacoes: "notes",
  observacao: "notes",
  notas: "notes",
  tags: "tags",
};

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function parseCustomersCSV(csvText: string): ParsedCustomerRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => HEADER_ALIASES[normalizeHeader(header)] ?? normalizeHeader(header),
  });

  return result.data.map((raw, index) => {
    const name = String(raw.name ?? "").trim();
    const cpf = onlyDigits(String(raw.cpf ?? ""));
    const whatsappDigits = onlyDigits(String(raw.whatsapp ?? ""));
    const email = String(raw.email ?? "").trim() || null;
    const tagsRaw = String(raw.tags ?? "").trim();

    let error: string | null = null;
    if (!name) error = "Nome em branco";
    else if (!isValidCPF(cpf)) error = "CPF inválido";
    else if (whatsappDigits.length < 10) error = "WhatsApp inválido";

    return {
      line: index + 2, // +1 pelo cabeçalho, +1 porque a planilha começa em 1
      name,
      cpf,
      whatsapp: whatsappDigits.length >= 10 ? phoneDigitsToE164BR(whatsappDigits) : "",
      email,
      cep: onlyDigits(String(raw.cep ?? "")) || null,
      addressStreet: String(raw.addressStreet ?? "").trim() || null,
      addressNumber: String(raw.addressNumber ?? "").trim() || null,
      addressComplement: String(raw.addressComplement ?? "").trim() || null,
      addressDistrict: String(raw.addressDistrict ?? "").trim() || null,
      addressCity: String(raw.addressCity ?? "").trim() || null,
      addressState: String(raw.addressState ?? "").trim() || null,
      notes: String(raw.notes ?? "").trim() || null,
      tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
      error,
    };
  });
}
