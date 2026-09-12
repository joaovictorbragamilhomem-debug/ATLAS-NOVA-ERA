export type ViaCepAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
};

// Busca de endereço por CEP — chamado direto do navegador (ViaCEP aceita
// requisições de página, sem precisar passar pelo nosso servidor).
export async function lookupCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
