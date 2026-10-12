// Supabase Edge Function: send-otp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, json, GMAIL_REGEX, normalizeEmail, getClientIp, isTorExit, randomCode, sendEmail,
} from "../_shared/otp.ts";

// ── Limits (tune here) ──
const COOLDOWN_SECONDS = 60;      // min gap between codes for the same email
const EMAIL_MAX_PER_HOUR = 5;     // codes per email per hour
const IP_MAX_PER_HOUR = 15;       // codes per IP per hour
const DEFAULT_DAILY_CAP = 400;    // total codes per 24h — keeps us under Gmail's daily sending quota
                                  // (override with the OTP_DAILY_CAP secret)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    if (!GMAIL_REGEX.test(email)) {
      return json(400, { error: 'Please enter a valid Gmail address (yourname@gmail.com)' });
    }

    const ip = getClientIp(req);
    const ua = (req.headers.get('user-agent') || '').slice(0, 300);

    if (await isTorExit(ip)) {
      return json(403, { error: 'Verification from anonymizing networks (Tor) is not allowed. Please use a normal internet connection.' });
    }

    const id = crypto.randomUUID();
    const code = randomCode();
    const dailyCap = Number(Deno.env.get('OTP_DAILY_CAP')) || DEFAULT_DAILY_CAP;

    const { data: verdict, error: rpcErr } = await supabase.rpc('create_email_otp', {
      p_id: id,
      p_email_norm: normalizeEmail(email),
      p_email: email,
      p_code: code,
      p_ip: ip,
      p_ua: ua,
      p_cooldown_seconds: COOLDOWN_SECONDS,
      p_email_max: EMAIL_MAX_PER_HOUR,
      p_email_window_minutes: 60,
      p_ip_max: IP_MAX_PER_HOUR,
      p_ip_window_minutes: 60,
      p_global_max: dailyCap,
    });

    if (rpcErr) {
      console.error('create_email_otp failed:', rpcErr.message);
      return json(500, { error: 'Could not start verification. Please try again in a minute.' });
    }
    if (verdict === 'cooldown') return json(429, { error: 'Please wait a minute before requesting another code.' });
    if (verdict === 'email_limit') return json(429, { error: 'Too many codes requested for this email. Please try again in an hour.' });
    if (verdict === 'ip_limit') return json(429, { error: 'Too many codes requested from this network. Please try again later.' });
    if (verdict === 'global_limit') return json(503, { error: 'We are receiving a very high number of requests right now. Please try again later.' });

    try {
      await sendEmail({
        to: email,
        subject: `${code} is your HexaVerse verification code`,
        text:
          `Your HexaVerse CloudFest verification code is ${code}.\n\n` +
          `It is valid for 10 minutes. Do not share it with anyone.\n` +
          `If you didn't request this, you can ignore this email.`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:420px">` +
          `<p>Your <b>HexaVerse CloudFest</b> verification code is:</p>` +
          `<p style="font-size:32px;letter-spacing:6px;font-weight:bold;margin:16px 0">${code}</p>` +
          `<p>It is valid for 10 minutes. Do not share it with anyone.</p>` +
          `<p style="color:#666;font-size:12px">If you didn't request this, you can ignore this email.</p>` +
          `</div>`,
      });
    } catch (err) {
      // Never log the code. Remove the row so a failed send doesn't count against the student.
      console.error('OTP email failed:', err instanceof Error ? err.message : 'unknown error');
      await supabase.from('email_otps').delete().eq('id', id);
      return json(502, { error: 'We could not send the email. Please check the address and try again.' });
    }

    // Housekeeping: drop rows older than 7 days (fire-and-forget)
    supabase
      .from('email_otps')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(() => {});

    return json(200, { success: true });
  } catch (err) {
    console.error('send-otp error:', err instanceof Error ? err.message : 'unknown error');
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});
