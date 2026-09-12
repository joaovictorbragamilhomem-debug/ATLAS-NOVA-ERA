import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// O token de acesso da Meta é tão sensível quanto uma senha — nunca fica em
// texto puro no banco. Cada organização tem o próprio token (não dá para
// usar só uma variável de ambiente, como fazemos com as outras chaves,
// porque cada assinante conecta o WhatsApp da própria empresa), então
// cifra-se o valor com uma chave mestra que essa sim mora só no .env.
const ALGORITHM = "aes-256-gcm";

function getMasterKey(): Buffer {
  const secret = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("WHATSAPP_TOKEN_ENCRYPTION_KEY não está configurada.");
  return scryptSync(secret, "atlas-nova-era-whatsapp", 32);
}

export function encryptToken(plainText: string): string {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptToken(cipherText: string): string {
  const [ivB64, authTagB64, dataB64] = cipherText.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) throw new Error("Token cifrado em formato inválido.");

  const key = getMasterKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
