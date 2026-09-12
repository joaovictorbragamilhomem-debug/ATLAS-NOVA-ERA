// Monta um CSV simples (RFC 4180: aspas duplicadas, campo entre aspas quando
// tiver vírgula/aspas/quebra de linha) e adiciona o BOM UTF-8 no começo, para
// o Excel abrir os acentos em português corretamente.
export function buildCSV(headers: string[], rows: string[][]): string {
  function escapeField(field: string): string {
    if (/[",\n]/.test(field)) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  const lines = [headers, ...rows].map((line) => line.map(escapeField).join(","));
  return "﻿" + lines.join("\r\n");
}
