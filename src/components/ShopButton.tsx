import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { PERFORMANCE_EASE, TACTILE_EASE } from "../lib/motionTokens";

type ShopButtonProps = HTMLMotionProps<"button"> & {
  children: ReactNode;
  variant?: "primary" | "dark" | "outline";
};

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md",
  dark: "bg-foreground text-background hover:bg-foreground-soft shadow-md",
  outline: "border border-border bg-surface text-foreground hover:border-primary hover:text-primary",
};

export function ShopButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ShopButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.025, transition: { duration: 0.18, ease: PERFORMANCE_EASE } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.12, ease: TACTILE_EASE } }}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
