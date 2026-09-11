// Fica "desligado" (só loga no console) até você configurar o Resend —
// nunca quebra o resto do sistema por falta de e-mail.
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log("[email] Resend não configurado — e-mail não enviado:", params.subject, "->", params.to);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[email] falha ao enviar via Resend:", response.status, body);
  }
}
