import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Preciso instalar algum programa?",
    a: "Não. O ATLAS funciona direto no navegador, no computador ou no celular. Também dá para instalar como um app na tela inicial do celular, sem passar pela loja de aplicativos.",
  },
  {
    q: "Funciona bem no celular?",
    a: "Sim — foi pensado para o celular desde o primeiro dia, já que é onde a maioria dos nossos usuários trabalha no dia a dia.",
  },
  {
    q: "Como o ATLAS se conecta ao meu WhatsApp?",
    a: "Você conecta o número que já usa. Estamos definindo a forma exata dessa conexão para garantir estabilidade e segurança da sua conta — vamos deixar bem claro antes de você conectar.",
  },
  {
    q: "Como funciona o teste grátis de 7 dias?",
    a: "Você cria a conta sem cartão de crédito e usa o sistema completo por 7 dias. Depois disso, escolhe um plano para continuar — se não escolher, sua conta fica só para consulta, sem perder nenhum dado.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa. Você também pode exportar todos os seus dados antes de cancelar.",
  },
  {
    q: "O que quer dizer o plano Vitalício?",
    a: "É um pagamento único, sem mensalidade, para uso justo (uma conta, para o seu negócio) enquanto o ATLAS existir. As vagas são limitadas.",
  },
  {
    q: "Meus dados e os dos meus clientes estão seguros?",
    a: "Sim. Cada conta só enxerga os próprios dados (é uma regra do banco de dados, não só da tela), e guardamos o consentimento e o histórico de alterações. O ATLAS não é um banco: não guarda nem movimenta dinheiro de ninguém.",
  },
  {
    q: "Dá para adicionar minha equipe?",
    a: "Sim. Você convida por e-mail e escolhe o papel de cada pessoa: Dono, Gestor ou Operador — cada um com permissões diferentes.",
  },
  {
    q: "Já tenho uma planilha com meus clientes. Dá para importar?",
    a: "Dá sim. Você envia o arquivo CSV, confere uma pré-visualização e importa tudo de uma vez.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Direto com quem constrói o produto, por e-mail e WhatsApp.",
  },
]

function Faq() {
  return (
    <section id="duvidas" className="cv-auto mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Dúvidas frequentes</h2>
      </div>

      <Accordion>
        {FAQS.map(({ q, a }, index) => (
          <AccordionItem key={q} value={`faq-${index}`}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export { Faq }
