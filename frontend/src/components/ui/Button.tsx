import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "font-medium rounded-md transition-material focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-38 disabled:cursor-not-allowed uppercase tracking-wide text-xs font-semibold relative overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-[#06B6D4] text-white elevation-2 hover:elevation-3 active:elevation-1 hover:from-primary-dark hover:to-[#0891B2]",
    secondary: "bg-white text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/40 elevation-1 hover:elevation-2",
    outline: "bg-transparent text-foreground border border-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5",
    text: "bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs min-h-[32px]",
    md: "px-6 py-3 text-sm min-h-[40px]",
    lg: "px-8 py-4 text-base min-h-[48px]",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

