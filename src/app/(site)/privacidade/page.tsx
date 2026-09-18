import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade" }

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-warning-soft bg-warning-soft px-4 py-3 text-sm text-warning">
        Rascunho — este texto ainda precisa ser revisado por um advogado antes de valer como
        política oficial. Não use para aceitar assinantes pagantes antes dessa revisão.
      </div>
      <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
      <p className="mt-2 text-xs text-muted-foreground">Última atualização: rascunho, sem data de vigência.</p>

      <div className="mt-6 flex flex-col gap-6 text-sm text-muted-foreground">
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">1. Papéis definidos pela LGPD</h2>
          <p>
            Nos termos da Lei Geral de Proteção de Dados (LGPD), quem assina o ATLAS é o{" "}
            <strong>controlador</strong> dos dados dos próprios clientes que cadastra — decide o
            que coletar e para quê. O ATLAS atua como <strong>operador</strong>: trata esses dados
            só para prestar o serviço contratado, seguindo as instruções do assinante.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">2. Quais dados tratamos</h2>
          <p>Do assinante e da equipe dele:</p>
          <ul className="list-disc pl-5">
            <li>Nome, e-mail e papel na equipe (Dono, Gestor, Operador)</li>
            <li>Dados de cobrança da assinatura (processados pelo parceiro de pagamentos)</li>
          </ul>
          <p>Dos clientes cadastrados pelo assinante (tomadores de crédito):</p>
          <ul className="list-disc pl-5">
            <li>Nome, CPF, WhatsApp, e-mail (opcional)</li>
            <li>Endereço (CEP e complemento)</li>
            <li>Dados do contrato: valor, parcelas, datas de vencimento, histórico de pagamento</li>
            <li>Histórico de mensagens trocadas pelo WhatsApp com o assinante</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">3. Consentimento</h2>
          <p>
            Quando um cliente preenche a ficha pública de cadastro, o aceite do termo fica
            registrado junto com a data, hora, endereço IP e a versão do termo aceito — isso serve
            como prova do consentimento, exigida pela LGPD.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">4. Isolamento entre contas</h2>
          <p>
            Cada assinante só acessa os próprios dados. Essa regra é aplicada no próprio banco de
            dados (não só na tela), então uma empresa nunca consegue ver dado de cliente de outra
            empresa que usa o ATLAS.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">5. Com quem compartilhamos dados</h2>
          <p>Usamos os seguintes prestadores de serviço (suboperadores) para funcionar:</p>
          <ul className="list-disc pl-5">
            <li>Supabase (banco de dados e login)</li>
            <li>Meta/WhatsApp Business Platform (envio das mensagens de cobrança)</li>
            <li>Asaas (processamento de pagamento da assinatura do ATLAS)</li>
            <li>Resend (envio de e-mails transacionais)</li>
            <li>Vercel (hospedagem do site e do sistema)</li>
          </ul>
          <p>Não vendemos dados pessoais a terceiros.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">6. Retenção e exclusão</h2>
          <p>
            Enquanto a conta estiver ativa, os dados ficam disponíveis normalmente. O assinante pode
            exportar todos os dados a qualquer momento (CSV).
          </p>
          <p className="italic">
            TODO (revisão jurídica): definir prazo exato de retenção após cancelamento da conta e
            processo formal de exclusão/anonimização, considerando obrigações legais de guarda
            (ex.: histórico financeiro).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">7. Direitos do titular dos dados</h2>
          <p>
            Qualquer titular de dados (assinante, membro da equipe ou cliente cadastrado) pode
            solicitar confirmação de tratamento, acesso, correção, anonimização ou eliminação dos
            próprios dados, conforme a LGPD. Pedidos sobre dados de clientes de um assinante devem
            ser direcionados primeiro ao próprio assinante (controlador); o ATLAS auxilia como
            operador quando acionado.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">8. Segurança</h2>
          <p>
            Segredos e chaves de API ficam apenas em variáveis de ambiente do servidor, nunca no
            código-fonte. Todo o tráfego usa HTTPS. Alterações importantes (criar, editar, dar
            baixa, estornar) ficam registradas em log de auditoria.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">9. Encarregado de dados (DPO)</h2>
          <p className="italic">
            TODO: definir e publicar o canal de contato do Encarregado de Proteção de Dados (DPO),
            exigido pela LGPD.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">10. Contato</h2>
          <p>
            Dúvidas sobre esta política:{" "}
            <a href="mailto:contato@atlasnovaera.com.br" className="text-foreground underline underline-offset-2">
              contato@atlasnovaera.com.br
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
