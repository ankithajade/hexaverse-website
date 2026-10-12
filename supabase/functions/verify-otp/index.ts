// Supabase Edge Function: verify-otp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, json, GMAIL_REGEX, normalizeEmail, getClientIp, isTorExit, sha256Hex, randomToken,
} from "../_shared/otp.ts";

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
    const code = String(body?.code || '').trim();

    if (!GMAIL_REGEX.test(email)) return json(400, { error: 'Please enter a valid Gmail address.' });
    if (!/^\d{6}$/.test(code)) return json(400, { error: 'Please enter the 6-digit code.' });

    if (await isTorExit(getClientIp(req))) {
      return json(403, { error: 'Verification from anonymizing networks (Tor) is not allowed.' });
    }

    const token = randomToken();
    const tokenHash = await sha256Hex(token);

    const { data: verdict, error: rpcErr } = await supabase.rpc('verify_email_otp', {
      p_email_norm: normalizeEmail(email),
      p_code: code,
      p_token_hash: tokenHash,
    });

    if (rpcErr) {
      console.error('verify_email_otp failed:', rpcErr.message);
      return json(500, { error: 'Could not verify the code. Please try again.' });
    }
    if (verdict === 'no_active_code') return json(400, { error: 'That code has expired or was never requested. Please request a new code.' });
    if (verdict === 'too_many_attempts') return json(429, { error: 'Too many incorrect attempts. Please request a new code.' });
    if (verdict === 'bad_code') return json(400, { error: 'Incorrect code. Please check it and try again.' });

    return json(200, { success: true, token });
  } catch (err) {
    console.error('verify-otp error:', err instanceof Error ? err.message : 'unknown error');
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});
