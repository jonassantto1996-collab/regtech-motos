export type AdminUserRecord = { role?: unknown; is_active?: unknown } | null;

export function isAuthorizedAdmin(record: AdminUserRecord, error: unknown): boolean {
  if (error || !record) return false;
  return record.role === "ADMIN" && record.is_active === true;
}
