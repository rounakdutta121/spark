type RequestLike = { headers: Headers };

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getAppUrlFromRequest(request: RequestLike): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    try {
      return normalizeUrl(origin);
    } catch {
      // ignore invalid origin
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (forwardedHost) {
    return normalizeUrl(`${forwardedProto}://${forwardedHost}`);
  }

  const host = request.headers.get("host")?.trim();
  if (!host) return null;

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (isLocalhost(host.split(":")[0] ?? host) ? "http" : "https");

  return normalizeUrl(`${proto}://${host}`);
}

function getAppUrlFromPlatform(): string | null {
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeUrl(
      vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`,
    );
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return normalizeUrl(
      vercelProduction.startsWith("http")
        ? vercelProduction
        : `https://${vercelProduction}`,
    );
  }

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    return normalizeUrl(
      railway.startsWith("http") ? railway : `https://${railway}`,
    );
  }

  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return normalizeUrl(render);

  const flyApp = process.env.FLY_APP_NAME?.trim();
  if (flyApp) return normalizeUrl(`https://${flyApp}.fly.dev`);

  return null;
}

/**
 * Resolves the public app URL for links in emails and redirects.
 * Prefers the live request origin so deployed domains work without reconfiguration.
 */
export function resolveAppUrl(request?: RequestLike): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return normalizeUrl(explicit);

  if (request) {
    const fromRequest = getAppUrlFromRequest(request);
    if (fromRequest) return fromRequest;
  }

  const fromPlatform = getAppUrlFromPlatform();
  if (fromPlatform) return fromPlatform;

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (publicUrl) return normalizeUrl(publicUrl);

  return "http://localhost:3000";
}

export function buildAppLink(path: string, baseUrl?: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = baseUrl ? normalizeUrl(baseUrl) : resolveAppUrl();
  return `${base}${normalizedPath}`;
}
