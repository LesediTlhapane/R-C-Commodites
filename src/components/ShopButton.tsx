import type { ButtonHTMLAttributes, ReactNode } from "react";

type ShopButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "dark" | "outline";
};

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  dark: "bg-foreground text-background hover:bg-foreground-soft",
  outline: "border border-border bg-surface text-foreground hover:border-primary hover:text-primary",
};

export function ShopButton({ children, className = "", variant = "primary", ...props }: ShopButtonProps) {
  return <button className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}