/**
 * R&C Commodities — "Performance in Motion"
 * Motion Design Tokens & Easing Constants
 *
 * Core Creative Direction:
 * - Speed, Precision, Grip, Engineering, Performance
 * - Easing: cubic-bezier(0.22, 1, 0.36, 1) — high-speed deceleration with confident mechanical lock
 */

import type { Transition, Variants } from "motion/react";

// Standard Performance Bezier Easing
export const PERFORMANCE_EASE = [0.22, 1, 0.36, 1] as const;
export const TACTILE_EASE = [0, 0, 0.2, 1] as const;

// Transition presets
export const transitions = {
  micro: {
    duration: 0.22,
    ease: TACTILE_EASE,
  } satisfies Transition,
  microSnappy: {
    duration: 0.18,
    ease: PERFORMANCE_EASE,
  } satisfies Transition,
  section: {
    duration: 0.65,
    ease: PERFORMANCE_EASE,
  } satisfies Transition,
  cinematic: {
    duration: 0.95,
    ease: PERFORMANCE_EASE,
  } satisfies Transition,
};

// Container stagger variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Reveal variants
export const fadeUpVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: PERFORMANCE_EASE,
    },
  },
};

export const fadeLeftVariant: Variants = {
  hidden: {
    opacity: 0,
    x: -28,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: PERFORMANCE_EASE,
    },
  },
};

export const fadeRightVariant: Variants = {
  hidden: {
    opacity: 0,
    x: 28,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: PERFORMANCE_EASE,
    },
  },
};

export const scaleRevealVariant: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: PERFORMANCE_EASE,
    },
  },
};

// Card interaction presets
export const cardHoverProps = {
  whileHover: {
    y: -4,
    transition: { duration: 0.25, ease: PERFORMANCE_EASE },
  },
  whileTap: {
    scale: 0.99,
    transition: { duration: 0.15, ease: TACTILE_EASE },
  },
};

export const buttonTactileProps = {
  whileHover: {
    scale: 1.02,
    transition: { duration: 0.18, ease: PERFORMANCE_EASE },
  },
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.12, ease: TACTILE_EASE },
  },
};
