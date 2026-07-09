import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SILOS = ["hiphophaven", "raphaven", "musichaven", "sportshaven", "fithaven", "cannahaven", "hmg"] as const;
type Silo = (typeof SILOS)[number];

function siloEnvKey(silo: string, suffix: "URL" | "USER" | "APP_PASSWORD"): string {
  return `WP_${silo.toUpperCase()}_${suffix}`;
}

function getSiloEnv(silo: string) {
  const url = process.env[siloEnvKey(silo, "URL")] ?? "";
  const user = process.env[siloEnvKey(silo, "USER")] ?? "";
  const password = process.env[siloEnvKey(silo, "APP_PASSWORD")] ?? "";
  return { url, user, password, configured: Boolean(url && user && password) };
}

function wpRestBase(url: string): string {
  return url.replace(/\/+$/, "") + "/wp-json/wp/v2";
}

function basicAuth(user: string, password: string): string {
  return "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
}

/**
 * SSRF guard: reject non-http(s) schemes and private/internal IP ranges.
 * Operators supply their own WP site URLs — this prevents the server from
 * being used as a proxy to reach internal infrastructure.
 */
function isAllowedWPUrl(raw: string): { ok: true } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "Invalid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: `Only http/https URLs are allowed (got ${parsed.protocol}).` };
  }
  const host = parsed.hostname.toLowerCase();
  // Block localhost and loopback
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost")) {
    return { ok: false, reason: "Localhost URLs are not allowed." };
  }
  // Block private IPv4 ranges: 10.x, 172.16-31.x, 192.168.x, 169.254.x
  const privateIPv4 = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/;
  if (privateIPv4.test(host)) {
    return { ok: false, reason: "Private/internal IP addresses are not allowed." };
  }
  // Block metadata endpoints (AWS, GCP, Azure)
  if (host === "169.254.169.254" || host === "metadata.google.internal" || host === "metadata.azure.internal") {
    return { ok: false, reason: "Cloud metadata endpoints are not allowed." };
  }
  return { ok: true };
}

router.get("/wordpress/status", (req, res) => {
  const silo = typeof req.query.silo === "string" ? req.query.silo : "";
  if (silo && SILOS.includes(silo as Silo)) {
    const env = getSiloEnv(silo);
    res.json({ configured: env.configured, siteUrl: env.url });
    return;
  }
  // No silo param — return all-silo summary
  const statuses = Object.fromEntries(
    SILOS.map((s) => {
      const env = getSiloEnv(s);
      return [s, { configured: env.configured, siteUrl: env.url }];
    })
  );
  const anyConfigured = Object.values(statuses).some((s) => s.configured);
  res.json({ configured: anyConfigured, statuses });
});

router.post("/wordpress/test", async (req, res) => {
  const { silo, overrideUrl, overrideUser, overridePassword } = req.body as {
    silo?: string;
    overrideUrl?: string;
    overrideUser?: string;
    overridePassword?: string;
  };

  const env = silo ? getSiloEnv(silo) : { url: "", user: "", password: "", configured: false };
  const url = overrideUrl?.trim() || env.url;
  const user = overrideUser?.trim() || env.user;
  const password = overridePassword?.trim() || env.password;

  if (!url || !user || !password) {
    res.status(400).json({ ok: false, message: "Missing url, user, or password." });
    return;
  }

  // SSRF guard on operator-supplied overrideUrl
  if (overrideUrl?.trim()) {
    const guard = isAllowedWPUrl(url);
    if (!guard.ok) {
      res.status(400).json({ ok: false, message: `Invalid override URL: ${guard.reason}` });
      return;
    }
  }

  try {
    const testUrl = `${wpRestBase(url)}/users/me`;
    const response = await fetch(testUrl, {
      headers: {
        Authorization: basicAuth(user, password),
        "User-Agent": "HMG-Newsroom/1.0",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = (await response.json()) as { name?: string; slug?: string };
      res.json({
        ok: true,
        siteUrl: url,
        user: data.name ?? data.slug ?? user,
        message: `Connected to ${url} as ${data.name ?? user}`,
      });
    } else {
      const text = await response.text().catch(() => "");
      res.json({
        ok: false,
        message: `WordPress rejected the request (HTTP ${response.status})${text ? `: ${text.slice(0, 120)}` : ""}`,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    res.json({ ok: false, message: message.includes("timeout") ? "Connection timed out — check the URL." : message });
  }
});

router.post("/wordpress/publish", async (req, res) => {
  const body = req.body as {
    silo?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    status?: "draft" | "publish";
    slug?: string;
    canonicalUrl?: string;
    videoEmbed?: string;
    featuredMediaId?: number;
    metaDescription?: string;
    categories?: string[];
    tags?: string[];
    overrideUrl?: string;
    overrideUser?: string;
    overridePassword?: string;
  };

  if (!body.title || !body.content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }

  const silo = body.silo ?? "";
  const env = getSiloEnv(silo);
  const url = body.overrideUrl?.trim() || env.url;
  const user = body.overrideUser?.trim() || env.user;
  const password = body.overridePassword?.trim() || env.password;

  if (!url || !user || !password) {
    res.status(400).json({
      error: `WordPress credentials not configured for silo "${silo}". Set WP_${silo.toUpperCase()}_URL, WP_${silo.toUpperCase()}_USER, and WP_${silo.toUpperCase()}_APP_PASSWORD environment variables, or provide overrideUrl/overrideUser/overridePassword in the request.`,
    });
    return;
  }

  // SSRF guard on operator-supplied overrideUrl
  if (body.overrideUrl?.trim()) {
    const guard = isAllowedWPUrl(url);
    if (!guard.ok) {
      res.status(400).json({ error: `Invalid override URL: ${guard.reason}` });
      return;
    }
  }

  try {
    const postsUrl = `${wpRestBase(url)}/posts`;
    const payload: Record<string, unknown> = {
      title: body.title,
      content: body.content,
      status: body.status ?? "draft",
    };
    if (body.excerpt) payload.excerpt = body.excerpt;
    if (body.slug) payload.slug = body.slug;
    if (body.featuredMediaId) payload.featured_media = body.featuredMediaId;

    const response = await fetch(postsUrl, {
      method: "POST",
      headers: {
        Authorization: basicAuth(user, password),
        "Content-Type": "application/json",
        "User-Agent": "HMG-Newsroom/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        id?: number;
        link?: string;
        guid?: { rendered?: string };
        status?: string;
        title?: { rendered?: string };
      };
      res.json({
        postId: data.id,
        link: data.link,
        url: data.guid?.rendered ?? data.link,
        status: data.status,
        title: data.title?.rendered ?? body.title,
      });
    } else {
      const text = await response.text().catch(() => "");
      res.status(400).json({
        error: `WordPress API returned HTTP ${response.status}: ${text.slice(0, 200)}`,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    res.status(500).json({ error: message });
  }
});

export default router;
