import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/public-app/status", (_req, res) => {
  const configured = Boolean(
    process.env.PUBLIC_APP_API_URL && process.env.PUBLIC_APP_API_KEY
  );
  res.json({ configured });
});

router.post("/public-app/publish", async (req, res) => {
  const apiUrl = process.env.PUBLIC_APP_API_URL?.trim();
  const apiKey = process.env.PUBLIC_APP_API_KEY?.trim();

  if (!apiUrl || !apiKey) {
    res.status(400).json({
      error: "Public app not configured. Set PUBLIC_APP_API_URL and PUBLIC_APP_API_KEY environment variables.",
      configured: false,
    });
    return;
  }

  const body = req.body as {
    silo?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    canonicalUrl?: string;
    videoEmbed?: string;
    featuredImageUrl?: string;
    categories?: string[];
    tags?: string[];
  };

  if (!body.title || !body.content) {
    res.status(400).json({ error: "title and content are required", configured: true });
    return;
  }

  try {
    const endpoint = `${apiUrl.replace(/\/+$/, "")}/api/articles`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "HMG-Newsroom/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = (await response.json()) as { url?: string; link?: string; status?: string };
      res.json({ configured: true, ...data });
    } else {
      const text = await response.text().catch(() => "");
      res.status(400).json({
        error: `Public app API returned HTTP ${response.status}: ${text.slice(0, 200)}`,
        configured: true,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    res.status(500).json({ error: message, configured: true });
  }
});

export default router;
