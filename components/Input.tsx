"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block space-y-2" htmlFor={inputId}>
        {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "focus-ring h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-50",
            "placeholder:text-slate-500",
            error && "border-red-400/60",
            className
          )}
          {...props}
        />
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
        {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </label>
    );
  }
);

Input.displayName = "Input";
