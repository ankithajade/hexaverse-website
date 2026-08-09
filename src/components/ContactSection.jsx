import ScrollReveal from './ScrollReveal';

export default function ContactSection() {
  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <ScrollReveal style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>Reach Out</div>
          <h2 className="section-title">Get in Touch</h2>
          <p className="section-desc" style={{ margin: '0 auto', marginBottom: '24px' }}>
            Don Bosco Institute of Technology (DBIT)<br />
            Questions, collaborations, or sponsorship inquiries &mdash; we&apos;d love to hear from you.
          </p>
        </ScrollReveal>

        <ScrollReveal className="contact-links">
          <a href="mailto:awsstudentbuildergroup.dbit@gmail.com" className="contact-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4l-10 8L2 4" />
            </svg>
            awsstudentbuildergroup.dbit@gmail.com
          </a>
          <a
            href="https://www.instagram.com/awssbg_dbit?igsh=cWg3NDlocG9yZHQ4"
            className="contact-link"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <circle cx="17.5" cy="6.5" r="1.5" />
            </svg>
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/company/aws-cloud-club-don-bosco-institute-of-technology/"
            className="contact-link"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            LinkedIn
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
