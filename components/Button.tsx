"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-sky-400/30 bg-sky-500 text-white hover:bg-sky-400",
  secondary: "border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.07] hover:text-white",
  danger: "border-red-400/25 bg-red-500/15 text-red-100 hover:bg-red-500/25",
  success: "border-emerald-400/25 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  warning: "border-amber-400/25 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
);

Button.displayName = "Button";
