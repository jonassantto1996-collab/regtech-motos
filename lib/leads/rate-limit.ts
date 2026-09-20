import { createHash } from "node:crypto";

export function hashRateLimitKey(value: string, secret: string | undefined): string {
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente para rate limiting");
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function isRateLimitAllowed(data: unknown, error: unknown): boolean {
  if (error) return false;
  return data === true;
}
