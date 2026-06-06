// Module resolution hook for running Haven AI engine tests under node:test +
// --experimental-strip-types. The app source uses the Vite "@/" alias and
// extensionless TS imports, neither of which Node resolves natively. This hook
// maps "@/<path>" to the package's src/ directory and resolves extensionless or
// ".js" specifiers to their on-disk ".ts" file. It is test-only tooling; it
// never changes runtime behavior of the app.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// This file lives at src/lib/hmg/haven-ai/__tests__/ — src root is four up.
const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

function resolveTsFile(absNoExt) {
  if (existsSync(absNoExt) && statSync(absNoExt).isFile()) return absNoExt;
  const candidates = [
    `${absNoExt}.ts`,
    `${absNoExt}.tsx`,
    path.join(absNoExt, "index.ts"),
    path.join(absNoExt, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const abs = path.join(SRC_ROOT, specifier.slice(2));
    const file = resolveTsFile(abs);
    if (file) {
      return { url: pathToFileURL(file).href, shortCircuit: true };
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    specifier.endsWith(".js") &&
    context.parentURL
  ) {
    const asUrl = new URL(specifier, context.parentURL);
    if (!existsSync(fileURLToPath(asUrl))) {
      const tsFile = resolveTsFile(fileURLToPath(asUrl).slice(0, -3));
      if (tsFile) {
        return { url: pathToFileURL(tsFile).href, shortCircuit: true };
      }
    }
  }

  return next(specifier, context);
}
