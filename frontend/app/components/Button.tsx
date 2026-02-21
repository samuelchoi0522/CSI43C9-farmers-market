"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as MuiButton } from "@mui/material";
import { styled } from "@mui/material/styles";

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

// Styled Material UI Button for primary variant with custom green color
const StyledMuiButton = styled(MuiButton)(() => ({
  backgroundColor: "#10b981 !important",
  color: "#ffffff !important",
  fontWeight: 500,
  borderRadius: "0.5rem",
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#059669 !important",
    color: "#ffffff !important",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25) !important",
  },
  "&:focus": {
    backgroundColor: "#10b981 !important",
    color: "#ffffff !important",
  },
  "&:active": {
    backgroundColor: "#047857 !important",
    color: "#ffffff !important",
  },
  "&.Mui-disabled": {
    backgroundColor: "#10b981 !important",
    color: "#ffffff !important",
    opacity: 0.5,
    cursor: "not-allowed",
  },
  "&.MuiButton-sizeSmall": {
    padding: "0.375rem 0.75rem",
    fontSize: "0.875rem",
  },
  "&.MuiButton-sizeMedium": {
    padding: "0.5rem 1rem",
    fontSize: "1rem",
  },
  "&.MuiButton-sizeLarge": {
    padding: "0.75rem 1.5rem",
    fontSize: "1.125rem",
  },
}));

/**
 * Global Button component with consistent hover effects across light and dark modes.
 * 
 * Primary variant uses Material UI Button component.
 * Other variants use custom styled buttons.
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
  // If primary variant, use Material UI Button
  if (variant === "primary") {
    const muiSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";
    const { type, onClick, disabled, form, formAction, formEncType, formMethod, formNoValidate, formTarget, name, value, autoFocus } = props;
    return (
      <StyledMuiButton
        variant="contained"
        size={muiSize}
        disableRipple={false}
        className={`hover-lift click-scale active:scale-95 ${className}`}
        type={type as "button" | "submit" | "reset" | undefined}
        onClick={onClick}
        disabled={disabled}
        form={form}
        formAction={formAction}
        formEncType={formEncType}
        formMethod={formMethod}
        formNoValidate={formNoValidate}
        formTarget={formTarget}
        name={name}
        value={value}
        autoFocus={autoFocus}
        sx={{
          backgroundColor: "#10b981",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#059669",
            color: "#ffffff",
          },
          "&:focus": {
            backgroundColor: "#10b981",
            color: "#ffffff",
          },
          "&:active": {
            backgroundColor: "#047857",
            color: "#ffffff",
          },
        }}
      >
        {children}
      </StyledMuiButton>
    );
  }

  // Base classes for all other buttons with smooth animations
  const baseClasses = "transition-all duration-200 ease-out rounded-lg font-medium cursor-pointer hover-lift click-scale active:scale-95";
  
  // Variant styles with consistent hover effects and smooth transitions
  const variantClasses = {
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-[#10b981]/10 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 hover:bg-[#10b981]/10 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-[#10b981]/10 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed",
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

