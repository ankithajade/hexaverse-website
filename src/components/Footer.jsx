/**
 * Shared footer — identical across all 10 original pages.
 * The brand color is inherited from --dept-accent (set per page) or
 * falls back to --cyan on the home page.
 */
export default function Footer({ accentColor }) {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          <span className="brand" style={accentColor ? { color: accentColor } : undefined}>
            HexaVerse CloudFest &apos;26
          </span>
        </p>
        <p style={{ marginTop: '6px' }}>
          AWS Student Builder Group &middot; Don Bosco Institute of Technology
        </p>
        <p style={{ marginTop: '4px' }}>&copy; 2026 &mdash; All rights reserved</p>
      </div>
    </footer>
  );
}
