"use client";

import { useEffect, useState, useCallback } from "react";

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const darkMode = localStorage.getItem("darkMode");
  // Only use dark mode if explicitly set, default to light mode
  return darkMode === "true";
}

interface DarkModeToggleProps {
  /** Position of the toggle button. Defaults to "fixed" */
  position?: "fixed" | "absolute" | "relative" | "static";
  /** Additional CSS classes to apply to the button */
  className?: string;
}

export default function DarkModeToggle({ 
  position = "fixed",
  className = ""
}: DarkModeToggleProps) {
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

  // Default positioning classes based on position prop
  const positionClasses = {
    fixed: "fixed top-6 right-6",
    absolute: "absolute top-6 right-6",
    relative: "relative",
    static: "static"
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`${positionClasses[position]} p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md z-50 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform flex items-center justify-center ${className}`}
      aria-label="Toggle dark mode"
    >
      {!isDark ? (
        <span className="material-icons leading-none">dark_mode</span>
      ) : (
        <span className="material-icons leading-none">light_mode</span>
      )}
    </button>
  );
}

