/**
 * pageVariants.js
 * ─────────────────────────────────────────────────────────────────
 * Framer Motion variants for route-level page transitions.
 *
 * Usage:
 *   import { pageVariants, pageTransition } from '@/animations/pageVariants'
 *
 *   <motion.div
 *     variants={pageVariants}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *     transition={pageTransition}
 *   >
 *     {children}
 *   </motion.div>
 */

/** Slide-up + fade — default page entrance */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 18,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

/** Spring-like ease for page transitions */
export const pageTransition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1], // css ease-in-out equivalent
  duration: 0.32,
}

/** Fade-only variant — used for modal overlays / auth pages */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

export const fadeTransition = {
  duration: 0.25,
  ease: 'easeInOut',
}

/** Slide-in from right — used for detail / side panels */
export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 40 },
}

/** Slide-in from left — used for back-navigation feel */
export const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
}
