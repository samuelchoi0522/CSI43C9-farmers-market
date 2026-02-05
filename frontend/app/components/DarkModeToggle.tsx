"use client";

import { useEffect, useState, useCallback } from "react";

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const darkMode = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return darkMode === "true" || (!darkMode && prefersDark);
}

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return getInitialDarkMode();
  });

  useEffect(() => {
    // Sync DOM with initial state
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDark]);

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-6 right-6 p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md z-50 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform"
      aria-label="Toggle dark mode"
    >
      <span className="material-icons block dark:hidden">dark_mode</span>
      <span className="material-icons hidden dark:block">light_mode</span>
    </button>
  );
}

