// Primitivas de UI (patrón shadcn/ui, sin dependencias externas).
import * as React from "react";
import { cn } from "@/lib/cn";

/* -------- Card -------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-[#e3e7e3] bg-white shadow-sm", className)}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-ink", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

/* -------- Button -------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};
export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    outline: "border border-[#d4ddd6] bg-white text-ink hover:bg-brand-50",
    ghost: "text-brand-700 hover:bg-brand-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

/* -------- Badge -------- */
export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "green" | "amber" | "red" | "earth" }) {
  const tones: Record<string, string> = {
    neutral: "bg-gray-100 text-gray-600",
    green: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    earth: "bg-earth-100 text-[#8a6d3b]",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}

/* -------- Input / Select / Label -------- */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-ink", className)} {...props} />;
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-[#d4ddd6] bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
          className,
        )}
        {...props}
      />
    );
  },
);
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-[#d4ddd6] bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
          className,
        )}
        {...props}
      />
    );
  },
);

/* -------- Progress -------- */
export function Progress({ value, tone = "green" }: { value: number; tone?: "green" | "amber" | "red" }) {
  const colors: Record<string, string> = {
    green: "bg-brand-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={cn("h-full rounded-full", colors[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
