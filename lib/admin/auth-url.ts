function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveAuthBaseUrl(params: {
  configuredUrl?: string;
  vercelUrl?: string;
  vercelEnv?: string;
}): string | null {
  const configured = normalizeOrigin(params.configuredUrl);
  const vercel = normalizeOrigin(
    params.vercelUrl
      ? params.vercelUrl.startsWith("http")
        ? params.vercelUrl
        : `https://${params.vercelUrl}`
      : undefined
  );

  if (params.vercelEnv === "production") return configured ?? vercel;
  if (params.vercelEnv) return vercel ?? configured;
  return configured ?? vercel;
}
