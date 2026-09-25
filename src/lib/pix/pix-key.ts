import { onlyDigits } from "@/lib/masks";
import { isValidCPF } from "@/lib/validators";

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

export type ParsedPixKey = { type: PixKeyType; key: string };

const EVP_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+55\d{10,11}$/;

// Returns the key in the format the Pix directory stores it, or null when the
// type can't be told apart safely (e.g. 11 digits that aren't a valid CPF could
// be a phone typed without +55 — guessing wrong would point to another account).
export function parsePixKey(raw: string): ParsedPixKey | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.includes("@")) return { type: "EMAIL", key: value };
  if (EVP_PATTERN.test(value)) return { type: "EVP", key: value };

  const compactPhone = value.replace(/[\s()-]/g, "");
  if (PHONE_PATTERN.test(compactPhone)) return { type: "PHONE", key: compactPhone };

  if (/^[\d.\-/\s]+$/.test(value)) {
    const digits = onlyDigits(value);
    if (digits.length === 11 && isValidCPF(digits)) return { type: "CPF", key: digits };
    if (digits.length === 14) return { type: "CNPJ", key: digits };
  }

  return null;
}
