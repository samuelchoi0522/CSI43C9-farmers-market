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
    
    // First, check localStorage for saved preference
    try {
      const storedDarkMode = localStorage.getItem("darkMode");
      if (storedDarkMode !== null) {
        return storedDarkMode === "true";
      }
    } catch (e) {
      console.error("Failed to read darkMode from localStorage:", e);
    }
    
    // Fallback to checking the DOM (should match the script in layout.tsx)
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // Initialize from localStorage on mount (only once)
    try {
      const storedDarkMode = localStorage.getItem("darkMode");
      if (storedDarkMode !== null) {
        const shouldBeDark = storedDarkMode === "true";
        const currentlyDark = document.documentElement.classList.contains("dark");
        if (shouldBeDark !== currentlyDark) {
          if (shouldBeDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
          setIsDark(shouldBeDark);
        }
      }
    } catch (e) {
      console.error("Failed to read darkMode from localStorage:", e);
    }
    
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
  }, []); // Empty dependency array - only run on mount

  const toggleDarkMode = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const htmlElement = document.documentElement;
    const currentlyDark = htmlElement.classList.contains("dark");
    const newDarkMode = !currentlyDark;
    
    // Immediately update DOM and localStorage
    try {
      if (newDarkMode) {
        htmlElement.classList.add("dark");
        localStorage.setItem("darkMode", "true");
      } else {
        htmlElement.classList.remove("dark");
        localStorage.setItem("darkMode", "false");
      }
    } catch (e) {
      console.error("Failed to save darkMode to localStorage:", e);
      // Still update the DOM even if localStorage fails
      if (newDarkMode) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
    
    // Update state - this will trigger a re-render
    setIsDark(newDarkMode);
    
    // Dispatch custom event for other components
    const event = new CustomEvent("darkModeChange", { detail: { isDark: newDarkMode } });
    window.dispatchEvent(event);
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
      className={`${getPositionClasses()} p-2 rounded-full bg-white dark:bg-zinc-800 shadow-md z-[9999] text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-all duration-200 ease-out hover:shadow-lg flex items-center justify-center cursor-pointer hover-lift dark-mode-toggle ${className}`}
      style={{ 
        backgroundColor: isDark ? undefined : '#ffffff',
        pointerEvents: 'auto'
      }}
      aria-label="Toggle dark mode"
    >
      <span className={`material-icons leading-none transition-all duration-300 ${!isDark ? 'rotate-0' : 'rotate-180'}`}>
        {!isDark ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}

