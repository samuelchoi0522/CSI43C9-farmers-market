"use client";

import { useEffect, useState, useCallback } from "react";

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
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // Listen for changes to the dark class on the html element
    const checkDarkMode = () => {
      const isCurrentlyDark = document.documentElement.classList.contains("dark");
      setIsDark(isCurrentlyDark);
    };
    
    const observer = new MutationObserver(checkDarkMode);
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    // Also listen for custom event
    window.addEventListener("darkModeChange", checkDarkMode);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("darkModeChange", checkDarkMode);
    };
  }, []);

  const toggleDarkMode = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const htmlElement = document.documentElement;
    const currentlyDark = htmlElement.classList.contains("dark");
    const newDarkMode = !currentlyDark;
    
    console.log("[DarkModeToggle] Clicked! Current:", currentlyDark, "New:", newDarkMode);
    
    // Immediately update DOM and localStorage
    if (newDarkMode) {
      htmlElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      console.log("[DarkModeToggle] Added dark class");
    } else {
      htmlElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      console.log("[DarkModeToggle] Removed dark class");
    }
    
    // Verify the class was added/removed
    const hasDarkClass = htmlElement.classList.contains("dark");
    console.log("[DarkModeToggle] HTML element now has dark class:", hasDarkClass);
    console.log("[DarkModeToggle] HTML classes:", htmlElement.className);
    
    // Update state - this will trigger a re-render
    setIsDark(newDarkMode);
    
    // Dispatch custom event for other components
    const event = new CustomEvent("darkModeChange", { detail: { isDark: newDarkMode } });
    window.dispatchEvent(event);
    
    // Double-check after a brief delay
    requestAnimationFrame(() => {
      const stillHasDark = htmlElement.classList.contains("dark");
      console.log("[DarkModeToggle] After animation frame - has dark class:", stillHasDark);
      if (stillHasDark !== newDarkMode) {
        console.error("[DarkModeToggle] MISMATCH! Expected:", newDarkMode, "Got:", stillHasDark);
        // Force it
        if (newDarkMode) {
          htmlElement.classList.add("dark");
        } else {
          htmlElement.classList.remove("dark");
        }
      }
    });
  }, []);

  // Default positioning classes based on position prop
  const getPositionClasses = () => {
    const hasBottom = className.includes("bottom-");
    const hasTop = className.includes("top-");
    
    if (position === "fixed") {
      if (hasBottom) {
        return "fixed right-6";
      }
      return hasTop ? "fixed right-6" : "fixed top-6 right-6";
    }
    if (position === "absolute") {
      if (hasBottom) {
        return "absolute right-6";
      }
      return hasTop ? "absolute right-6" : "absolute top-6 right-6";
    }
    return position;
  };

  return (
    <button
      onClick={toggleDarkMode}
      type="button"
      className={`${getPositionClasses()} p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md z-[9999] text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer ${className}`}
      style={{ 
        backgroundColor: isDark ? undefined : '#ffffff',
        pointerEvents: 'auto'
      }}
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

