import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function readPort(requireRuntimeEnv: boolean): number {
  const rawPort = process.env.PORT;
  if (!rawPort) {
    if (requireRuntimeEnv) {
      throw new Error("PORT environment variable is required but was not provided.");
    }
    return 4173;
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  return port;
}

function readBasePath(requireRuntimeEnv: boolean): string {
  const basePath = process.env.BASE_PATH;
  if (!basePath) {
    if (requireRuntimeEnv) {
      throw new Error("BASE_PATH environment variable is required but was not provided.");
    }
    return "/";
  }
  return basePath;
}

export default defineConfig(async ({ command }) => {
  const requireRuntimeEnv = command !== "build";
  const port = readPort(requireRuntimeEnv);
  const basePath = readBasePath(requireRuntimeEnv);

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-radix": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-label",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
              "@radix-ui/react-accordion",
              "@radix-ui/react-collapsible",
            ],
            "vendor-motion": ["framer-motion"],
            "vendor-html2canvas": ["html2canvas"],
            "vendor-icons": ["lucide-react"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-sonner": ["sonner"],
            "vendor-zod": ["zod"],
            "vendor-wouter": ["wouter"],
            "views-editorial": [
              "./src/components/newsroom/ArtBotView",
              "./src/components/newsroom/SEOMasterView",
              "./src/components/newsroom/CorpusView",
            ],
            "views-production": [
              "./src/components/newsroom/CutMasterView",
              "./src/components/newsroom/ClipBrandView",
              "./src/components/newsroom/MediaLibraryView",
            ],
            "views-revenue": [
              "./src/components/newsroom/SalesPipelineView",
              "./src/components/newsroom/CommandCenterView",
            ],
            "views-system": [
              "./src/components/newsroom/FounderKnowledgeBaseView",
              "./src/components/newsroom/RecoveryCenterView",
              "./src/components/newsroom/HavenAIControlCenter",
              "./src/components/newsroom/AICapabilityMatrixView",
              "./src/components/newsroom/OperatorReadinessView",
            ],
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: { strict: true },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
