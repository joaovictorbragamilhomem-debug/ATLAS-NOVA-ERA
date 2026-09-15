// Gera o código Pix "Copia e Cola" (padrão BR Code / EMV do Banco Central)
// — puro texto, sem chamar nenhuma API externa nem gateway de pagamento.
// O dinheiro vai direto da conta do cliente pra chave Pix da organização;
// o ATLAS só monta o texto do código, nunca vê nem move esse dinheiro.
//
// Referência: manual "Arranjo Pix" do Banco Central (formato EMV/BR Code).

export type PixCopiaColaParams = {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid?: string;
};

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

// Os campos de nome/cidade do Pix só aceitam ASCII simples — nomes de
// empresa costumam ter acento ("São Paulo"), então tira os acentos antes
// de cortar no tamanho máximo.
function sanitizeAsciiField(value: string, maxLen: number, fallback: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim();
  return (cleaned || fallback).slice(0, maxLen);
}

function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixCopiaCola(params: PixCopiaColaParams): string {
  const pixKey = params.pixKey.trim();
  if (!pixKey) throw new Error("Chave Pix vazia.");

  const merchantName = sanitizeAsciiField(params.merchantName, 25, "RECEBEDOR");
  const merchantCity = sanitizeAsciiField(params.merchantCity, 15, "CIDADE");
  const amount = (params.amountCents / 100).toFixed(2);
  const txid = (params.txid ?? "***").slice(0, 25);

  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey);
  const additionalData = tlv("05", txid);

  const payloadWithoutCrc =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", "11") + // Ponto de Iniciação: estático (valor fixo)
    tlv("26", merchantAccountInfo) + // Informações da conta (Pix)
    tlv("52", "0000") + // Categoria do comerciante (não informado)
    tlv("53", "986") + // Moeda: Real (ISO 4217)
    tlv("54", amount) + // Valor da transação
    tlv("58", "BR") + // País
    tlv("59", merchantName) + // Nome do recebedor
    tlv("60", merchantCity) + // Cidade do recebedor
    tlv("62", additionalData) + // Dados adicionais (txid)
    "6304"; // Início do campo do CRC16 (ID "63", tamanho "04")

  return payloadWithoutCrc + crc16ccitt(payloadWithoutCrc);
}
