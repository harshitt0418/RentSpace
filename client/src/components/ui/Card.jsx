/**
 * Card.jsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable card component with:
 *  - Dark surface background
 *  - Optional hover lift animation (Framer Motion)
 *  - Gradient border variant
 *  - Skeleton loading state
 *  - Composable sub-components: Card.Header, Card.Body, Card.Footer
 *
 * Usage:
 *   <Card>content</Card>
 *   <Card hoverable gradient>content</Card>
 *   <Card loading />        ← renders skeleton
 *
 *   <Card>
 *     <Card.Header>Title</Card.Header>
 *     <Card.Body>Body</Card.Body>
 *     <Card.Footer>Footer</Card.Footer>
 *   </Card>
 */
import { motion } from 'framer-motion'
import { cardVariants } from '@/animations/cardVariants'
import clsx from 'clsx'

// ── Main Card ─────────────────────────────────────────────────────────────────
function Card({
  children,
  className,
  hoverable = false,   // enables lift animation + hover border glow
  gradient = false,    // wraps with gradient border
  loading = false,     // renders skeleton placeholder
  onClick,
  ...props
}) {

  // ── Skeleton state ────────────────────────────────────────────────────────
  if (loading) {
    return <CardSkeleton className={className} />
  }

  const baseClass = clsx(
    'card',                                   // from globals.css
    hoverable && 'card-hover cursor-pointer', // hover utilities from globals.css
    gradient && 'gradient-border',            // gradient border pseudo-element
    className
  )

  // Hoverable cards get Framer Motion — others stay as plain divs
  if (hoverable) {
    return (
      <motion.div
        className={baseClass}
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={baseClass} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'px-5 py-4 border-b border-dark-500/50 font-semibold text-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'px-5 py-4 border-t border-dark-500/50 text-sm text-dark-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────
function CardSkeleton({ className }) {
  return (
    <div className={clsx('card overflow-hidden', className)}>
      {/* Image skeleton */}
      <div className="skeleton h-44 w-full rounded-none rounded-t-2xl" />
      <div className="p-5 space-y-3">
        {/* Title line */}
        <div className="skeleton h-4 w-3/4" />
        {/* Sub-title line */}
        <div className="skeleton h-3 w-1/2" />
        {/* Body lines */}
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-3 w-1/4" />
          <div className="skeleton h-3 w-1/4" />
        </div>
        {/* CTA row */}
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default Card
