// Testes de banco de dados que não dependem de um Supabase real: sobem um
// Postgres (via WASM, @electric-sql/pglite), aplicam as migrações de
// supabase/migrations e conferem as regras de segurança mais importantes.
//
// Roda com: npm run test:db
//
// Cobre 2 dos critérios de aceite do projeto:
// - uma organização nunca vê dado de outra (RLS)
// - a mesma parcela não recebe a mesma cobrança duas vezes (índice único)

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const db = new PGlite({ extensions: { pgcrypto } });

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`PASS ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// auth.users/auth.uid() são fornecidos pelo Supabase de verdade; aqui
// recriamos só o suficiente para as migrações e políticas funcionarem.
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid());
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('app.current_user_id', true), '')::uuid;
  $$;
`);

for (const file of files) {
  await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
}
console.log(`Migrações aplicadas: ${files.length} arquivo(s).\n`);

// Papel de baixo privilégio, equivalente ao "authenticated" do Supabase —
// diferente da conexão que rodou as migrações, este não ignora RLS.
await db.exec(`
  create role authenticated;
  grant usage on schema public to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
`);

const orgA = (await db.query(`insert into organizations (name) values ('Empresa A') returning id`)).rows[0].id;
const orgB = (await db.query(`insert into organizations (name) values ('Empresa B') returning id`)).rows[0].id;

const userA = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
const userB = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
const userOperatorA = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;

await db.query(`insert into memberships (organization_id, user_id, role) values ($1, $2, 'owner')`, [orgA, userA]);
await db.query(`insert into memberships (organization_id, user_id, role) values ($1, $2, 'owner')`, [orgB, userB]);
await db.query(`insert into memberships (organization_id, user_id, role) values ($1, $2, 'operator')`, [orgA, userOperatorA]);

const customerA = (await db.query(
  `insert into customers (organization_id, name, cpf, whatsapp) values ($1, 'Cliente A', '11111111111', '+5511900000001') returning id`,
  [orgA]
)).rows[0].id;
const customerB = (await db.query(
  `insert into customers (organization_id, name, cpf, whatsapp) values ($1, 'Cliente B', '22222222222', '+5511900000002') returning id`,
  [orgB]
)).rows[0].id;

const contractA = (await db.query(
  `insert into contracts (organization_id, customer_id, principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents)
   values ($1, $2, 100000, 1, 'monthly', current_date, 100000) returning id`,
  [orgA, customerA]
)).rows[0].id;
const installmentA = (await db.query(
  `insert into installments (contract_id, organization_id, number, due_date, amount_cents) values ($1, $2, 1, current_date, 100000) returning id`,
  [contractA, orgA]
)).rows[0].id;

async function asUser(userId, fn) {
  await db.exec(`set role authenticated;`);
  await db.query(`select set_config('app.current_user_id', $1, false);`, [userId]);
  try {
    return await fn();
  } finally {
    await db.exec(`select set_config('app.current_user_id', '', false); reset role;`);
  }
}

// --- Isolamento entre organizações --------------------------------------
await asUser(userA, async () => {
  const seen = await db.query(`select id from customers;`);
  const ids = seen.rows.map((r) => r.id);
  check("dono da Empresa A vê o cliente da própria empresa", ids.includes(customerA));
  check("dono da Empresa A NÃO vê o cliente da Empresa B", !ids.includes(customerB));
});

await asUser(userB, async () => {
  const seen = await db.query(`select id from customers;`);
  const ids = seen.rows.map((r) => r.id);
  check("dono da Empresa B vê o cliente da própria empresa", ids.includes(customerB));
  check("dono da Empresa B NÃO vê o cliente da Empresa A", !ids.includes(customerA));
});

// --- Papéis: operador não decide crédito nem estorna --------------------
await asUser(userOperatorA, async () => {
  try {
    await db.query(
      `insert into contracts (organization_id, customer_id, principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents)
       values ($1, $2, 50000, 1, 'monthly', current_date, 50000)`,
      [orgA, customerA]
    );
    check("operador NÃO consegue criar contrato (deveria ter sido bloqueado)", false);
  } catch {
    check("operador é bloqueado ao tentar criar contrato", true);
  }
});

await asUser(userOperatorA, async () => {
  try {
    await db.query(`update installments set status = 'reversed' where id = $1`, [installmentA]);
    check("operador NÃO consegue estornar parcela (deveria ter sido bloqueado)", false);
  } catch {
    check("operador é bloqueado ao tentar estornar parcela", true);
  }
});

// --- Papel: só o Dono conecta o WhatsApp (Fase 5) -----------------------
await asUser(userOperatorA, async () => {
  try {
    await db.query(
      `insert into whatsapp_connections (organization_id, provider) values ($1, 'meta_cloud_api')`,
      [orgA]
    );
    check("operador NÃO consegue conectar o WhatsApp (deveria ter sido bloqueado)", false);
  } catch {
    check("operador é bloqueado ao tentar conectar o WhatsApp", true);
  }
});

await asUser(userA, async () => {
  try {
    await db.query(
      `insert into whatsapp_connections (organization_id, provider) values ($1, 'meta_cloud_api')`,
      [orgA]
    );
    check("dono consegue conectar o WhatsApp da própria empresa", true);
  } catch (err) {
    check(`dono consegue conectar o WhatsApp da própria empresa (erro: ${err.message})`, false);
  }
});

await asUser(userOperatorA, async () => {
  try {
    await db.query(`update installments set status = 'paid', paid_amount_cents = 100000 where id = $1`, [installmentA]);
    check("operador consegue dar baixa normal em uma parcela", true);
  } catch (err) {
    check(`operador consegue dar baixa normal em uma parcela (erro: ${err.message})`, false);
  }
});

// --- Referência cruzada entre organizações -------------------------------
await asUser(userA, async () => {
  try {
    await db.query(
      `insert into contracts (organization_id, customer_id, principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents)
       values ($1, $2, 50000, 1, 'monthly', current_date, 50000)`,
      [orgA, customerB]
    );
    check("bloqueia contrato da Empresa A apontando para cliente da Empresa B", false);
  } catch {
    check("bloqueia contrato da Empresa A apontando para cliente da Empresa B", true);
  }
});

// --- Não cobrar a mesma parcela duas vezes -------------------------------
const templateA = (await db.query(
  `insert into message_templates (organization_id, name, body) values ($1, 'Lembrete', 'Oi {{nome}}') returning id`,
  [orgA]
)).rows[0].id;

await db.query(
  `insert into message_queue (organization_id, customer_id, installment_id, template_id, trigger_type, scheduled_for, rendered_body)
   values ($1, $2, $3, $4, 'due_today', now(), 'Oi Cliente A')`,
  [orgA, customerA, installmentA, templateA]
);

try {
  await db.query(
    `insert into message_queue (organization_id, customer_id, installment_id, template_id, trigger_type, scheduled_for, rendered_body)
     values ($1, $2, $3, $4, 'due_today', now(), 'Oi Cliente A de novo')`,
    [orgA, customerA, installmentA, templateA]
  );
  check("bloqueia a mesma parcela recebendo o mesmo gatilho 2x no mesmo dia", false);
} catch {
  check("bloqueia a mesma parcela recebendo o mesmo gatilho 2x no mesmo dia", true);
}

// --- Renegociação de contrato --------------------------------------------
// Reproduz, direto no banco, a mesma sequência de operações que
// renegotiateContractAction (src/lib/contracts/actions.ts) faz: cria o
// contrato novo já ligado ao antigo, marca as parcelas antigas em aberto
// como 'renegotiated' e o contrato antigo também.
const contractC = (await db.query(
  `insert into contracts (organization_id, customer_id, principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents)
   values ($1, $2, 200000, 2, 'monthly', current_date, 100000) returning id`,
  [orgA, customerA]
)).rows[0].id;
const installmentC1 = (await db.query(
  `insert into installments (contract_id, organization_id, number, due_date, amount_cents) values ($1, $2, 1, current_date, 100000) returning id`,
  [contractC, orgA]
)).rows[0].id;
const installmentC2 = (await db.query(
  `insert into installments (contract_id, organization_id, number, due_date, amount_cents) values ($1, $2, 2, current_date, 100000) returning id`,
  [contractC, orgA]
)).rows[0].id;

await asUser(userA, async () => {
  await db.query(`update installments set status = 'partially_paid', paid_amount_cents = 30000 where id = $1`, [installmentC1]);
});

await asUser(userOperatorA, async () => {
  try {
    await db.query(`update installments set status = 'renegotiated' where id = $1`, [installmentC1]);
    check("operador NÃO consegue renegociar parcela (deveria ter sido bloqueado)", false);
  } catch {
    check("operador é bloqueado ao tentar renegociar parcela", true);
  }
});

let contractD;
await asUser(userA, async () => {
  try {
    contractD = (await db.query(
      `insert into contracts (organization_id, customer_id, principal_amount_cents, installments_count, periodicity, first_due_date, installment_amount_cents, renegotiated_from_contract_id)
       values ($1, $2, 170000, 1, 'monthly', current_date, 170000, $3) returning id`,
      [orgA, customerA, contractC]
    )).rows[0].id;
    await db.query(`update installments set status = 'renegotiated' where id in ($1, $2)`, [installmentC1, installmentC2]);
    await db.query(`update contracts set status = 'renegotiated' where id = $1`, [contractC]);
    check("dono consegue renegociar o contrato (contrato novo + parcelas antigas atualizadas)", true);
  } catch (err) {
    check(`dono consegue renegociar o contrato (erro: ${err.message})`, false);
  }
});

await asUser(userA, async () => {
  const oldContract = (await db.query(`select status from contracts where id = $1`, [contractC])).rows[0];
  const newContract = (await db.query(`select renegotiated_from_contract_id from contracts where id = $1`, [contractD])).rows[0];
  const oldInstallments = (await db.query(`select status from installments where contract_id = $1`, [contractC])).rows;
  check("contrato antigo fica com status 'renegotiated'", oldContract.status === "renegotiated");
  check("contrato novo fica ligado ao contrato antigo", newContract.renegotiated_from_contract_id === contractC);
  check(
    "as parcelas em aberto do contrato antigo ficam 'renegotiated'",
    oldInstallments.every((i) => i.status === "renegotiated")
  );
});

console.log(failures === 0 ? "\nTodos os testes passaram." : `\n${failures} teste(s) falharam.`);
process.exit(failures === 0 ? 0 : 1);
