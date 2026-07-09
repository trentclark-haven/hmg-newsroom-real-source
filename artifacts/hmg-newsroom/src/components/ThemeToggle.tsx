import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "hmg-theme-v1";

function readStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    /* localStorage unavailable (private mode / SSR) — fall through */
  }
  return null;
}

/**
 * Resolve the theme to use on first paint.
 * Rule: a saved preference always wins. Otherwise default to dark —
 * HMG's premium baseline — regardless of OS preference.
 */
export function resolveInitialTheme(): ThemeMode {
  return readStoredTheme() ?? "dark";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  // Hint native UI (scrollbars, form controls, autofill) for a premium feel.
  root.style.colorScheme = mode;
}

/**
 * Apply the resolved theme synchronously at module/app load to avoid a
 * flash of the wrong theme before React mounts.
 */
export function initTheme() {
  applyTheme(resolveInitialTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* persistence best-effort only */
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);
  const toggle = useCallback(
    () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, setTheme, toggle };
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        "w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
      }
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="header-theme-toggle"
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

export default ThemeToggle;
