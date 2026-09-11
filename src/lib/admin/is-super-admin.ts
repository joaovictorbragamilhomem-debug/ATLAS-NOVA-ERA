export function isSuperAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
