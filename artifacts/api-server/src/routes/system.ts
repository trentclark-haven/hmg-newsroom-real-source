import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SILOS = ["hiphophaven", "raphaven", "musichaven", "sportshaven", "fithaven", "cannahaven", "hmg"] as const;

function siloConfigured(silo: string): boolean {
  return Boolean(
    process.env[`WP_${silo.toUpperCase()}_URL`] &&
    process.env[`WP_${silo.toUpperCase()}_USER`] &&
    process.env[`WP_${silo.toUpperCase()}_APP_PASSWORD`]
  );
}

router.get("/system/status", (_req, res) => {
  const wpSilos = Object.fromEntries(
    SILOS.map((s) => [s, { envConfigured: siloConfigured(s) }])
  );
  const wpConfiguredCount = Object.values(wpSilos).filter((s) => s.envConfigured).length;

  const publicAppConfigured = Boolean(
    process.env.PUBLIC_APP_API_URL && process.env.PUBLIC_APP_API_KEY
  );

  res.json({
    ok: true,
    ts: Date.now(),
    version: process.env.npm_package_version ?? "1.0.0",
    api: { ok: true },
    // aiProxy: honest state — no server-side ping; checked client-side via HavenAI engine
    aiProxy: {
      ok: false,
      message: "AI proxy status is checked client-side — configure Ollama or a paid provider in Haven AI settings",
    },
    wordpress: {
      configuredSilos: wpConfiguredCount,
      totalSilos: SILOS.length,
      silos: wpSilos,
      status: wpConfiguredCount === 0 ? "unconfigured" : wpConfiguredCount === SILOS.length ? "fully_configured" : "partial",
    },
    publicApp: {
      configured: publicAppConfigured,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
