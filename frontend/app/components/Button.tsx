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
  // Base classes for all buttons with smooth animations
  const baseClasses = "transition-all duration-200 ease-out rounded-lg font-medium cursor-pointer hover-lift click-scale active:scale-95";
  
  // Variant styles with consistent hover effects and smooth transitions
  const variantClasses = {
    primary: "bg-[#10b981] text-white hover:bg-[#059669] hover:shadow-lg hover:shadow-[#10b981]/25 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed",
    danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed",
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

