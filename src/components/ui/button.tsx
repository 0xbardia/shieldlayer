import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        // Variants
        variant === "primary" &&
          "bg-brand text-white shadow-soft hover:bg-brand-600 hover:shadow-glow",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        variant === "outline" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
        variant === "danger" &&
          "bg-red-500 text-white hover:bg-red-600 shadow-soft",
        // Sizes
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
