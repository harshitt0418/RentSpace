/**
 * modalVariants.js
 * ─────────────────────────────────────────────────────────────────
 * Framer Motion variants for modals, drawers, and dropdowns.
 *
 * Usage:
 *   import { backdropVariants, modalVariants } from '@/animations/modalVariants'
 *
 *   <AnimatePresence>
 *     {isOpen && (
 *       <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="hidden">
 *         <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
 *           {children}
 *         </motion.div>
 *       </motion.div>
 *     )}
 *   </AnimatePresence>
 */

/** Semi-transparent dark backdrop */
export const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
}

/** Centred modal panel — scale + fade */
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 26,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.93,
    y: 8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/** Bottom-sheet / drawer sliding up from bottom */
export const drawerVariants = {
  hidden:  { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 32 },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.22, ease: 'easeIn' },
  },
}

/** Dropdown menus — slide down from top */
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transformOrigin: 'top center',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.96,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
}

/** Notification / toast slide in from right */
export const toastVariants = {
  hidden:  { opacity: 0, x: 60, scale: 0.92 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
  exit: {
    opacity: 0,
    x: 60,
    transition: { duration: 0.2 },
  },
}
