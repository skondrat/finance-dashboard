import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function syncThemeToDOM(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function persistTheme(theme: "light" | "dark") {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", theme);
  // Fire-and-forget persist to backend
  fetch("/api/v1/users/me/theme", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  }).catch(() => {
    // Silently ignore — backend persistence is best-effort
  });
}

function applyTheme(theme: "light" | "dark") {
  syncThemeToDOM(theme);
  persistTheme(theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      applyTheme(next);
      return { theme: next };
    }),
}));

// Apply the initial theme to the DOM on store creation
if (typeof document !== "undefined") {
  syncThemeToDOM(getInitialTheme());
}
