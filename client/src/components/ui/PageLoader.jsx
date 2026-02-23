/**
 * PageLoader.jsx
 * ─────────────────────────────────────────────────────────────────
 * Full-screen loading state used as the React Suspense fallback
 * while lazy-loaded page chunks are being fetched.
 */
import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, transition: 'background var(--transition)' }}>
      {/* Animated brand logo */}
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Pulsing logo mark */}
        <motion.div
          style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-sm)' }}
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 24px 4px rgba(99, 102, 241, 0.35)',
              '0 0 40px 8px rgba(99, 102, 241, 0.55)',
              '0 0 24px 4px rgba(99, 102, 241, 0.35)',
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>RS</span>
        </motion.div>

        {/* Animated dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
