"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: ReactNode;
  /** Button variant style */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Global Button component with consistent hover effects across light and dark modes.
 * 
 * Hover behavior:
 * - Light mode: 15% opacity hover effect
 * - Dark mode: 15% opacity hover effect
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  // Base classes for all buttons
  const baseClasses = "transition-colors rounded-lg font-medium cursor-pointer";
  
  // Variant styles with consistent hover effects
  // Light mode: 15% opacity, Dark mode: 15% opacity
  const variantClasses = {
    primary: "bg-[#10b981] text-white hover:opacity-90 disabled:opacity-50",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50/15 dark:hover:bg-slate-700/15 disabled:opacity-50",
    outline: "border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 hover:bg-slate-50/15 dark:hover:bg-slate-700/15 disabled:opacity-50",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50/15 dark:hover:bg-slate-700/15 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:opacity-90 disabled:opacity-50",
  };
  
  // Size styles
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  // Combine all classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, " ");
  
  return (
    <button
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
}

