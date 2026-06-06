// Registers the "@/" alias + TS-extension resolution hook for node:test runs.
// Imported via `node --import ./.../register-alias.mjs` before the test files.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL(import.meta.dirname + "/"));
