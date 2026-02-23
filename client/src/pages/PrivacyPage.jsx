/**
 * PrivacyPage.jsx — Static privacy policy page
 */
export default function PrivacyPage() {
  return (
    <div className="static-page">
      <div className="static-hero" style={{ minHeight: 'auto', padding: '120px 24px 40px' }}>
        <div className="hero-bg" />
        <div className="static-hero-inner">
          <div className="section-eyebrow">Legal</div>
          <h1 className="static-hero-title" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
            Privacy <span className="grad">Policy</span>
          </h1>
          <p className="static-hero-sub">Last updated: January 2026</p>
        </div>
      </div>

      <div className="section legal-content" style={{ maxWidth: 760 }}>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly — such as your name, email, location,
          and profile details when you create an account. We also collect usage data
          including pages visited, search queries, and interaction patterns to improve
          our platform.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to: operate and improve the platform, facilitate rentals
          between users, send transactional notifications, provide customer support,
          and detect & prevent fraud.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We share limited profile information (name, rating, member since) with other
          users to enable trust. We never sell your personal data. We may share anonymized,
          aggregated statistics for research purposes.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We use industry-standard security measures including encryption in transit (TLS),
          hashed passwords (bcrypt), and secure JWT-based authentication. Despite our
          best efforts, no method of transmission over the Internet is 100% secure.
        </p>

        <h2>5. Cookies & Local Storage</h2>
        <p>
          We use localStorage to persist your authentication session and theme preferences.
          We do not use third-party tracking cookies. Essential cookies are used only
          for session management.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You can access, update, or delete your personal information at any time through
          your profile settings. You can also request a complete data export or account
          deletion by contacting our support team.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We'll notify you of significant
          changes via email or in-app notification. Continued use of the platform
          constitutes acceptance of the updated policy.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this privacy policy, please reach out to us at
          <strong> privacy@rentspace.app</strong>.
        </p>
      </div>
    </div>
  )
}
