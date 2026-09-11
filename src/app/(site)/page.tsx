import type { Metadata } from "next"
import { Hero } from "./_components/hero"
import { BeforeAfter } from "./_components/before-after"
import { FeaturesBento } from "./_components/features-bento"
import { CollectionTimeline } from "./_components/collection-timeline"
import { MessageDemo } from "./_components/message-demo"
import { ProductTour } from "./_components/product-tour"
import { SecurityLgpd } from "./_components/security-lgpd"
import { Audience } from "./_components/audience"
import { PricingSection } from "./_components/pricing-section"
import { Faq } from "./_components/faq"
import { FinalCta } from "./_components/final-cta"
import { PRICING } from "@/lib/pricing"
import { SITE_URL, SITE_NAME } from "@/lib/site"

export const metadata: Metadata = {
  title: "ATLAS NOVA ERA — cobrança automática pelo WhatsApp",
  description:
    "Organize clientes, contratos e parcelas, e deixe a cobrança pelo WhatsApp acontecer sozinha. Teste grátis por 7 dias, sem cartão.",
  alternates: { canonical: SITE_URL },
}

function buildOffers() {
  const offers: Record<string, unknown>[] = []
  if (PRICING.monthlyCents !== null) {
    offers.push({
      "@type": "Offer",
      name: "Mensal",
      price: (PRICING.monthlyCents / 100).toFixed(2),
      priceCurrency: "BRL",
    })
  }
  if (PRICING.annualCents !== null) {
    offers.push({
      "@type": "Offer",
      name: "Anual",
      price: (PRICING.annualCents / 100).toFixed(2),
      priceCurrency: "BRL",
    })
  }
  if (PRICING.lifetimeCents !== null) {
    offers.push({
      "@type": "Offer",
      name: "Vitalício",
      price: (PRICING.lifetimeCents / 100).toFixed(2),
      priceCurrency: "BRL",
    })
  }
  return offers
}

export default function HomePage() {
  const offers = buildOffers()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "Painel para gestão de empréstimos, parcelas e cobrança automática pelo WhatsApp.",
    ...(offers.length > 0 ? { offers } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <BeforeAfter />
      <FeaturesBento />
      <CollectionTimeline />
      <MessageDemo />
      <ProductTour />
      <SecurityLgpd />
      <Audience />
      <PricingSection />
      <Faq />
      <FinalCta />
    </>
  )
}
