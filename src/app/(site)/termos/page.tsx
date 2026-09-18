import type { Metadata } from "next"

export const metadata: Metadata = { title: "Termos de Uso" }

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-warning-soft bg-warning-soft px-4 py-3 text-sm text-warning">
        Rascunho — este texto ainda precisa ser revisado por um advogado antes de valer como termo
        oficial. Não use para aceitar assinantes pagantes antes dessa revisão.
      </div>
      <h1 className="text-2xl font-semibold">Termos de Uso</h1>
      <p className="mt-2 text-xs text-muted-foreground">Última atualização: rascunho, sem data de vigência.</p>

      <div className="mt-6 flex flex-col gap-6 text-sm text-muted-foreground">
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">1. O que é o ATLAS NOVA ERA</h2>
          <p>
            O ATLAS NOVA ERA (&quot;ATLAS&quot;) é um sistema de gestão operado por 40.948.203 LUCAS
            VINICIUS DA LUZ VILLACORTA (CNPJ 40.948.203/0001-29), que ajuda quem trabalha com
            crédito a organizar clientes, contratos, parcelas e a comunicação de cobrança pelo
            WhatsApp.
          </p>
          <p>
            O ATLAS <strong>não é uma instituição financeira</strong>: não empresta, não guarda e
            não movimenta dinheiro de clientes de ninguém. O sistema apenas registra, calcula e
            ajuda a cobrar valores que já existem em contratos criados pelo próprio assinante.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">2. Quem pode assinar e responsabilidade legal</h2>
          <p>
            Quem assina o ATLAS é responsável por operar dentro da lei, incluindo o cumprimento dos
            limites legais de juros e encargos aplicáveis ao seu tipo de operação, e por garantir
            que tem base legal para tratar os dados pessoais dos próprios clientes que cadastra no
            sistema.
          </p>
          <p>
            O assinante declara ser maior de 18 anos e ter capacidade legal para contratar. Contas
            usadas para fins ilegais (ex.: agiotagem fora dos limites legais, cobrança com ameaça
            ou constrangimento) podem ser suspensas ou encerradas sem aviso prévio.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">3. Teste grátis, planos e cobrança</h2>
          <p>
            Novas contas começam com 7 dias de teste grátis, sem necessidade de cartão de crédito,
            com acesso ao sistema completo. Ao final do teste, o assinante escolhe um plano (Mensal,
            Anual ou Vitalício) para continuar usando o ATLAS normalmente.
          </p>
          <p>
            Se nenhum plano for escolhido, a conta não é excluída: ela passa para modo de{" "}
            <strong>somente consulta</strong>, sem perda de dados, até que um plano seja ativado.
          </p>
          <p>
            A cobrança dos planos pagos é processada por um parceiro de pagamentos (Asaas). O ATLAS
            não armazena dados completos de cartão de crédito.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">4. Cancelamento</h2>
          <p>
            O assinante pode cancelar a qualquer momento, sem multa. Antes de cancelar, é possível
            exportar todos os dados da conta (clientes, contratos, parcelas e pagamentos) em CSV.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">5. Equipe e permissões</h2>
          <p>
            O assinante (papel &quot;Dono&quot;) pode convidar outras pessoas da própria equipe por
            e-mail, atribuindo os papéis de Gestor ou Operador, cada um com permissões diferentes
            dentro da conta. O Dono é responsável pelo uso que sua equipe faz do sistema.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">6. WhatsApp e comunicação com clientes</h2>
          <p>
            Para usar a cobrança automática, o assinante conecta seu próprio número de WhatsApp
            Business (API oficial da Meta) à conta do ATLAS. O ATLAS não é dono desse número nem da
            relação comercial entre o assinante e os clientes dele — apenas automatiza o envio de
            mensagens configuradas pelo próprio assinante.
          </p>
          <p>
            O assinante é responsável por obter o consentimento adequado dos próprios clientes para
            receber mensagens automáticas de cobrança.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">7. Dados e privacidade</h2>
          <p>
            O tratamento de dados pessoais é descrito em detalhe na{" "}
            <a href="/privacidade" className="text-foreground underline underline-offset-2">
              Política de Privacidade
            </a>
            , que faz parte destes Termos.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">8. Propriedade intelectual</h2>
          <p>
            O software, a marca ATLAS NOVA ERA e o conteúdo do site pertencem ao operador do ATLAS.
            O assinante mantém a propriedade sobre os próprios dados inseridos no sistema (clientes,
            contratos, mensagens), que ficam disponíveis para exportação a qualquer momento.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">9. Disponibilidade e limitação de responsabilidade</h2>
          <p>
            O ATLAS é oferecido &quot;como está&quot;, sem garantia de disponibilidade
            ininterrupta. Não nos responsabilizamos por decisões de negócio, cobrança ou concessão
            de crédito tomadas pelo assinante com base nas informações do sistema — essas decisões
            são sempre do assinante.
          </p>
          <p className="italic">
            TODO (revisão jurídica): definir limites e exclusões de responsabilidade de forma
            juridicamente válida, incluindo hipóteses de indisponibilidade, perda de dados por
            falha de terceiros (Supabase, Meta, Asaas) e uso indevido pelo assinante.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">10. Alterações destes Termos</h2>
          <p>
            Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou
            dentro do sistema antes de entrarem em vigor.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">11. Foro e legislação aplicável</h2>
          <p className="italic">
            TODO (revisão jurídica): definir foro/comarca e confirmar legislação aplicável (Código
            de Defesa do Consumidor, Marco Civil da Internet, LGPD).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">12. Contato</h2>
          <p>
            Dúvidas sobre estes Termos:{" "}
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
