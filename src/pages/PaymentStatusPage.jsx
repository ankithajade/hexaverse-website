import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyPayment } from '../lib/registrationService';
import { registrationEvents } from '../data/registrationEvents';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ScrollReveal from '../components/ScrollReveal';

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');

  // Status: 'verifying' | 'success' | 'pending' | 'failed' | 'error'
  const [status, setStatus] = useState('verifying');
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setStatus('error');
      setErrorMsg('No order ID provided. Please access this page with a valid payment reference.');
      return;
    }

    setStatus('verifying');
    setErrorMsg('');

    try {
      const res = await verifyPayment({ order_id: orderId });

      if (res.status === 'success') {
        setResultData(res);
        setStatus('success');
      } else if (res.status === 'pending') {
        setResultData(res);
        setStatus('pending');
      } else {
        setResultData(res);
        setStatus('failed');
        setErrorMsg(res.message || 'Payment was not successful.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('failed');
      setErrorMsg(err.message || 'Unable to verify payment status with server.');
    }
  }, [orderId]);

  useEffect(() => {
    document.title = "Payment Status | DBIT HexaVerse CloudFest '26";
    window.scrollTo(0, 0);
    checkStatus();
  }, [checkStatus, retryCount]);

  const eventInfo = resultData?.team?.event_slug
    ? registrationEvents[resultData.team.event_slug]
    : null;

  return (
    <div>
      <Nav />

      <div className="container" style={{ paddingTop: '90px' }}>
        <BackButton style={{ marginBottom: '12px' }} />
        <ScrollReveal className="dept-breadcrumb" style={{ padding: 0 }}>
          <Link to="/">Home</Link> <span>/</span> <span>Payment Status</span>
        </ScrollReveal>
      </div>

      <main className="container" style={{ maxWidth: '680px', marginBottom: '80px' }}>
        <ScrollReveal className="mega-card" style={{ padding: '40px 32px', textAlign: 'center' }}>

          {/* ── 1. Verifying State ── */}
          {status === 'verifying' && (
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--bg-card-border)',
                borderTopColor: 'var(--cyan)',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--text)' }}>
                Verifying Payment...
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Securely confirming transaction with Cashfree and updating registration records.
              </p>
              {orderId && (
                <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                  Order: <code>{orderId}</code>
                </div>
              )}
            </div>
          )}

          {/* ── 2. Success State ── */}
          {status === 'success' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#10b981',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                ✓
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: '8px', color: 'var(--text)' }}>
                Registration Confirmed!
              </h2>
              <p style={{ color: '#10b981', fontWeight: 600, fontSize: '1.05rem', marginBottom: '24px' }}>
                UPI Payment Verified Successfully
              </p>

              {/* Summary Details Card */}
              <div style={{
                background: 'var(--bg)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '8px',
                padding: '20px 24px',
                textAlign: 'left',
                marginBottom: '28px',
                fontSize: '0.92rem',
              }}>
                {resultData?.team?.short_id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Team Short ID:</span>
                    <strong style={{ color: 'var(--cyan)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                      {resultData.team.short_id.toUpperCase()}
                    </strong>
                  </div>
                )}
                {resultData?.team?.team_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Team Name:</span>
                    <strong>{resultData.team.team_name}</strong>
                  </div>
                )}
                {eventInfo?.eventTitle && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Event:</span>
                    <strong>{eventInfo.eventTitle}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Order ID:</span>
                  <code style={{ fontSize: '0.85rem' }}>{orderId}</code>
                </div>
                {resultData?.amount_paid && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--bg-card-border)',
                    fontSize: '1.05rem',
                  }}>
                    <span>Amount Paid:</span>
                    <strong style={{ color: '#10b981' }}>₹{resultData.amount_paid}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/" className="btn-register" style={{ padding: '12px 32px' }}>
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* ── 3. Pending State ── */}
          {status === 'pending' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid #f59e0b',
                color: '#f59e0b',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                ⏳
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', marginBottom: '10px', color: 'var(--text)' }}>
                Payment Pending
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Your payment is currently awaiting confirmation from your UPI app or bank.
                If money was debited from your bank account, your registration will be automatically verified shortly.
              </p>

              {orderId && (
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Order ID: <code>{orderId}</code>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-register"
                  onClick={() => setRetryCount((c) => c + 1)}
                  style={{ padding: '12px 28px', cursor: 'pointer' }}
                >
                  Check Status Again
                </button>
                <Link to="/" className="btn-register" style={{ padding: '12px 28px', background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text)' }}>
                  Home
                </Link>
              </div>
            </div>
          )}

          {/* ── 4. Failed State ── */}
          {status === 'failed' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                color: '#ef4444',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                ✕
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', marginBottom: '10px', color: 'var(--text)' }}>
                Payment Incomplete
              </h2>
              <p style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '20px' }}>
                {errorMsg || 'The transaction could not be completed or was cancelled.'}
              </p>

              {orderId && (
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Order ID: <code>{orderId}</code>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-register"
                  onClick={() => setRetryCount((c) => c + 1)}
                  style={{ padding: '12px 24px', cursor: 'pointer' }}
                >
                  Re-check Status
                </button>
                <Link to="/#events" className="btn-register" style={{ padding: '12px 24px', background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', color: 'var(--text)' }}>
                  Browse Events
                </Link>
              </div>
            </div>
          )}

          {/* ── 5. Error State ── */}
          {status === 'error' && (
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '10px' }}>
                Invalid Request
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '24px' }}>
                {errorMsg || 'No valid order reference was found.'}
              </p>
              <Link to="/" className="btn-register" style={{ padding: '12px 32px' }}>
                Back to Home
              </Link>
            </div>
          )}

        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
