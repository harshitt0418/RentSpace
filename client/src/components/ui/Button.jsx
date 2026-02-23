/**
 * Button.jsx
 * ─────────────────────────────────────────────────────────────────
 * Fully reusable button component with:
 *  - Multiple variants: primary | secondary | ghost | danger | outline
 *  - Three sizes: sm | md | lg
 *  - Loading state with spinner
 *  - Left / right icon support
 *  - Framer Motion press animation
 *
 * Usage:
 *   <Button>Click me</Button>
 *   <Button variant="ghost" size="sm" leftIcon={<Plus size={16} />}>Add</Button>
 *   <Button loading>Saving...</Button>
 *   <Button variant="danger" onClick={handleDelete}>Delete</Button>
 */
import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ── Style maps ────────────────────────────────────────────────────────────────
const VARIANT_STYLES = {
  /** Filled gradient — main CTA */
  primary: [
    'bg-brand-gradient text-white',
    'hover:shadow-glow-sm hover:brightness-110',
    'active:brightness-95',
    'border border-transparent',
  ],
  /** Muted surface — secondary actions */
  secondary: [
    'btn-secondary',
    'border',
  ],
  /** Transparent — tertiary / nav actions */
  ghost: [
    'btn-ghost',
    'border border-transparent',
  ],
  /** Outlined brand border */
  outline: [
    'bg-transparent text-brand-400',
    'hover:bg-brand-500/10',
    'border border-brand-500/50 hover:border-brand-400',
  ],
  /** Destructive action */
  danger: [
    'bg-red-500/15 text-red-400',
    'hover:bg-red-500/25 hover:text-red-300',
    'border border-red-500/30',
  ],
}

const SIZE_STYLES = {
  sm: 'h-8  px-3.5 text-sm  gap-1.5 rounded-lg',
  md: 'h-10 px-5   text-sm  gap-2   rounded-xl',
  lg: 'h-12 px-7   text-base gap-2.5 rounded-xl',
}

// ── Component ─────────────────────────────────────────────────────────────────
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    onClick,
    type = 'button',
    fullWidth = false,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      // Subtle press animation
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        // Base styles — always applied
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant
        VARIANT_STYLES[variant],
        // Size
        SIZE_STYLES[size],
        // Full width override
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Loading spinner replaces left icon */}
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}

      {/* Label */}
      {children && <span>{children}</span>}

      {/* Right icon (never replaced by spinner) */}
      {rightIcon && !loading && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  )
})

export default Button
