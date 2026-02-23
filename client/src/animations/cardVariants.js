/**
 * cardVariants.js
 * ─────────────────────────────────────────────────────────────────
 * Framer Motion variants for item cards and staggered grid lists.
 *
 * Usage (single card):
 *   <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
 *
 * Usage (staggered grid parent):
 *   <motion.ul variants={containerVariants} initial="hidden" animate="visible">
 *     {items.map(item => (
 *       <motion.li key={item._id} variants={cardItemVariants}>
 *         <ItemCard item={item} />
 *       </motion.li>
 *     ))}
 *   </motion.ul>
 */

/** Interactive state variants for a single card */
export const cardVariants = {
  /** Resting state — card floats up slightly on hover */
  hover: {
    y: -8,
    // Slight scale gives a "lifted" premium feel
    scale: 1.015,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  /** Pressed state — pushes card down */
  tap: {
    y: 0,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

/** Parent container — staggers children on mount */
export const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      // Each child starts animating 80 ms after the previous one
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

/** Individual card animation (used as child of containerVariants) */
export const cardItemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
    },
  },
}

/** Skeleton shimmer — used while card data is loading */
export const skeletonVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.6,
      ease: 'linear',
      repeat: Infinity,
    },
  },
}
