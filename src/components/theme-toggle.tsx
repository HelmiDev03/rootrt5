"use client";

import { useEffect } from "react";
import { MoonIcon, SunIcon } from "./icons";

// Same key as the inline script in layout.tsx and the one in each doc.html,
// so the documentation follows the site's choice.
const STORAGE_KEY = "theme";

function applyTheme() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {}
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  // Follow a change made in another tab or in a documentation page, and system changes.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) applyTheme();
    };
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", applyTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", applyTheme);
    };
  }, []);

  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn px-2"
      aria-label="Basculer entre mode clair et sombre"
      title="Mode clair / sombre"
    >
      <SunIcon className="hidden size-4 dark:block" />
      <MoonIcon className="size-4 dark:hidden" />
    </button>
  );
}
