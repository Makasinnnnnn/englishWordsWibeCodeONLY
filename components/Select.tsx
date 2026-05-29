"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, id, children, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block space-y-2" htmlFor={inputId}>
        {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            "focus-ring h-11 w-full rounded-lg border border-white/10 bg-graphite-900 px-3 text-sm text-slate-50",
            error && "border-red-400/60",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? <span className="text-xs text-red-300">{error}</span> : null}
        {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </label>
    );
  }
);

Select.displayName = "Select";
