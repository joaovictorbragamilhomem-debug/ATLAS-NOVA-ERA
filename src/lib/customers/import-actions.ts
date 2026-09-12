"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/auth/current-user";
import { assertOrganizationIsWritable } from "@/lib/subscription/assert-writable";
import { logAudit } from "@/lib/audit/log";
import { isValidCPF } from "@/lib/validators";
import type { ParsedCustomerRow } from "@/lib/customers/import-csv";

export type ImportCustomersResult = {
  error: string | null;
  createdCount: number;
  skippedCount: number;
  skippedLines: number[];
};

// Reaproveita as mesmas linhas já validadas na tela (parseCustomersCSV), mas
// nunca confia só nisso: valida de novo aqui, porque quem manda a requisição
// pode não ser o mesmo navegador que rodou a validação.
export async function importCustomersAction(rows: ParsedCustomerRow[]): Promise<ImportCustomersResult> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Sessão expirada — entre novamente.", createdCount: 0, skippedCount: 0, skippedLines: [] };

  const blocked = await assertOrganizationIsWritable(membership.organizationId);
  if (blocked) return { error: blocked, createdCount: 0, skippedCount: 0, skippedLines: [] };

  const supabase = await getSupabaseServerClient();

  let createdCount = 0;
  const skippedLines: number[] = [];

  for (const row of rows) {
    if (row.error || !row.name || !isValidCPF(row.cpf) || !row.whatsapp) {
      skippedLines.push(row.line);
      continue;
    }

    const { error } = await supabase.from("customers").insert({
      organization_id: membership.organizationId,
      name: row.name,
      cpf: row.cpf,
      whatsapp: row.whatsapp,
      email: row.email,
      cep: row.cep,
      address_street: row.addressStreet,
      address_number: row.addressNumber,
      address_complement: row.addressComplement,
      address_district: row.addressDistrict,
      address_city: row.addressCity,
      address_state: row.addressState,
      notes: row.notes,
      tags: row.tags,
      created_by: membership.userId,
    });

    if (error) {
      skippedLines.push(row.line);
      continue;
    }

    createdCount++;
  }

  if (createdCount > 0) {
    await logAudit({
      organizationId: membership.organizationId,
      userId: membership.userId,
      action: "customer.imported_csv",
      entityType: "customer",
      entityId: null,
      after: { created_count: createdCount, skipped_count: skippedLines.length },
    });
    revalidatePath("/app/clientes");
  }

  return { error: null, createdCount, skippedCount: skippedLines.length, skippedLines };
}
