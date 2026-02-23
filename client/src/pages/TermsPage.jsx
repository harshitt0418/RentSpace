/**
 * TermsPage.jsx — Static terms of service page
 */
export default function TermsPage() {
  return (
    <div className="static-page">
      <div className="static-hero" style={{ minHeight: 'auto', padding: '120px 24px 40px' }}>
        <div className="hero-bg" />
        <div className="static-hero-inner">
          <div className="section-eyebrow">Legal</div>
          <h1 className="static-hero-title" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
            Terms of <span className="grad">Service</span>
          </h1>
          <p className="static-hero-sub">Last updated: January 2026</p>
        </div>
      </div>

      <div className="section legal-content" style={{ maxWidth: 760 }}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By using RentSpace, you agree to these Terms of Service and our Privacy Policy.
          If you do not agree, please do not use the platform.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          You must be at least 18 years old to create an account. You are responsible
          for maintaining the confidentiality of your credentials and for all activities
          under your account.
        </p>

        <h2>3. Listing & Renting Items</h2>
        <p>
          Owners are responsible for ensuring their listings are accurate and that items
          are in the described condition. Renters agree to return items on time and in
          the same condition. Both parties should communicate clearly through the
          platform's messaging system.
        </p>

        <h2>4. Payments & Fees</h2>
        <p>
          Rental payments are processed through the platform. RentSpace charges a
          small service fee on completed transactions. Refundable deposits are held
          securely and returned upon safe return of items.
        </p>

        <h2>5. Prohibited Content</h2>
        <p>
          Users may not list illegal items, stolen property, weapons, or hazardous
          materials. Listings must not contain misleading information or copyrighted
          content used without permission.
        </p>

        <h2>6. Reviews & Ratings</h2>
        <p>
          Reviews must be honest and based on actual rental experiences. We reserve the
          right to remove reviews that are fraudulent, abusive, or violate community
          guidelines.
        </p>

        <h2>7. Dispute Resolution</h2>
        <p>
          In case of disputes between users, RentSpace will act as a mediator. We may
          review evidence from both parties and make a binding resolution regarding
          deposits and refunds.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          RentSpace provides the platform as-is and does not guarantee the condition
          of listed items. We are not liable for damages arising from peer-to-peer
          transactions beyond the scope of our deposit protection system.
        </p>

        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms.
          Users may delete their accounts at any time through profile settings.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these terms, contact us at
          <strong> legal@rentspace.app</strong>.
        </p>
      </div>
    </div>
  )
}
