// Shared helpers for send-otp and verify-otp. (create-registration keeps its own copies.)

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Gmail only: 6–30 chars, letters/digits/dots, no "+alias", no consecutive dots
export const GMAIL_REGEX = /^(?!.*\.\.)[a-z0-9][a-z0-9.]{4,28}[a-z0-9]@gmail\.com$/i;

// Must stay identical to normalizeEmail() in create-registration and public.normalize_email().
export function normalizeEmail(email: string): string {
  const e = (email || '').trim().toLowerCase();
  const [local, domain] = e.split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
  }
  return e;
}

// cf-connecting-ip is set by Cloudflare and can't be forged by the client.
export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}

// ── Tor exit-node block (same approach as create-registration) ──
const TOR_LIST_URL = 'https://check.torproject.org/torbulkexitlist';
const TOR_REFRESH_MS = 60 * 60 * 1000;
const TOR_RETRY_MS = 5 * 60 * 1000;
let torIps: Set<string> | null = null;
let torFetchedAt = 0;
let torLastTry = 0;

export async function isTorExit(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  const now = Date.now();
  const stale = !torIps || now - torFetchedAt > TOR_REFRESH_MS;
  if (stale && now - torLastTry > TOR_RETRY_MS) {
    torLastTry = now;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(TOR_LIST_URL, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const ips = new Set((await res.text()).split('\n').map((l) => l.trim()).filter(Boolean));
        if (ips.size > 100) {
          torIps = ips;
          torFetchedAt = now;
        }
      }
    } catch (err) {
      console.error('Tor exit list fetch failed (failing open):', err);
    }
  }
  return torIps ? torIps.has(ip) : false;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Uniform 6-digit code (rejection sampling avoids modulo bias)
export function randomCode(): string {
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4294000000);
  return String(n % 1000000).padStart(6, '0');
}

// 32 random bytes -> 64 hex chars
export function randomToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

// ── Email sending. Provider chosen by the EMAIL_PROVIDER secret: "gmail" (default) or "resend". ──
export async function sendEmail(opts: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const provider = (Deno.env.get('EMAIL_PROVIDER') || 'gmail').toLowerCase();
  const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'HexaVerse CloudFest';

  if (provider === 'resend') {
    const key = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('EMAIL_FROM'); // must be on a domain verified in Resend
    if (!key || !from) throw new Error('Resend is not configured');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${from}>`, to: [opts.to], subject: opts.subject, text: opts.text, html: opts.html }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    return;
  }

  // Default: Gmail SMTP with an App Password, over implicit TLS on port 465.
  // (Ports 25 and 587 are blocked in Supabase Edge Functions.)
  const user = Deno.env.get('GMAIL_USER');
  const pass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !pass) throw new Error('Gmail SMTP is not configured');
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const client = new SMTPClient({
    connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user, password: pass } },
  });
  try {
    await client.send({ from: `${fromName} <${user}>`, to: opts.to, subject: opts.subject, content: opts.text, html: opts.html });
  } finally {
    await client.close();
  }
}
