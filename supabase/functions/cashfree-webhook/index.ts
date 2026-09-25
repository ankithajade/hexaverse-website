// Supabase Edge Function: cashfree-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
};

/**
 * Verify Cashfree Webhook Signature using HMAC-SHA256 of (timestamp + rawBody)
 */
async function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(timestamp + rawBody);
    const keyData = encoder.encode(secretKey);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    return computedSignature === signature;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Read Raw Body and Headers
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';
    const rawBody = await req.text();

    if (!timestamp || !signature || !cashfreeSecretKey) {
      console.warn('Webhook rejected: Missing timestamp, signature, or server secret key');
      return new Response(JSON.stringify({ error: 'Missing webhook signature headers' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reject webhooks that are too old (replay protection)
    const webhookTimestamp = Number(timestamp);
    const currentTime = Date.now();
    const webhookAge = Math.abs(currentTime - webhookTimestamp);

    if (!Number.isFinite(webhookTimestamp) || webhookAge > 5 * 60 * 1000) {
      console.warn('Webhook rejected: Timestamp is missing, invalid, or too old');
      return new Response(JSON.stringify({ error: 'Invalid or expired webhook timestamp' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verify Signature
    const isValid = await verifyWebhookSignature(rawBody, timestamp, signature, cashfreeSecretKey);
    if (!isValid) {
      console.warn('Webhook rejected: Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse Webhook Payload
    const payload = JSON.parse(rawBody);
    const eventType = payload.type; // e.g. 'PAYMENT_SUCCESS_WEBHOOK', 'PAYMENT_FAILED_WEBHOOK', 'PAYMENT_USER_DROPPED_WEBHOOK'
    const orderData = payload.data?.order || {};
    const paymentData = payload.data?.payment || {};

    const orderId = orderData.order_id || payload.order_id;
    const paymentOrderId = paymentData.order_id || orderId;

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing order_id in webhook payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure payment belongs to the expected Cashfree order
    if (paymentOrderId && paymentOrderId !== orderId) {
      console.error(`Webhook order mismatch: paymentData.order_id (${paymentOrderId}) !== orderData.order_id (${orderId})`);
      return new Response(JSON.stringify({ error: 'Payment and order ID mismatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Lookup Matching Payment Record
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('gateway_order_id', orderId)
      .maybeSingle();

    if (fetchErr || !payment) {
      console.warn(`Webhook received for unknown gateway_order_id: ${orderId}`);
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Idempotency Check
    if (payment.status === 'success') {
      return new Response(JSON.stringify({ received: true, message: 'Already confirmed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Handle Payment Success
    const paymentStatus = paymentData.payment_status;
    const isSuccess = paymentStatus === 'SUCCESS' && eventType === 'PAYMENT_SUCCESS_WEBHOOK';

    if (isSuccess) {
      const cfPaymentId = paymentData.cf_payment_id ? String(paymentData.cf_payment_id).trim() : null;

      // Gateway payment info validation: Real Cashfree payment ID is mandatory
      if (!cfPaymentId) {
        console.error(`Webhook rejected: Missing cf_payment_id for successful payment on order ${orderId}`);
        return new Response(JSON.stringify({ error: 'Missing required gateway payment information' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate payment method is UPI if method/group info is provided
      const paymentGroup = (paymentData.payment_group || '').toLowerCase();
      const hasUpiMethod = paymentData.payment_method?.upi !== undefined;
      const isExplicitNonUpi = paymentGroup !== '' && paymentGroup !== 'upi' && !hasUpiMethod;

      if (isExplicitNonUpi) {
        console.error(`Webhook rejected non-UPI payment method (${paymentGroup}) for order ${orderId}`);
        return new Response(JSON.stringify({ error: 'Payment method must be UPI only' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // EXACT amount equality check (never accept less or greater than expected)
      const expectedAmount = Number(Number(payment.amount_expected).toFixed(2));
      const actualPaid = Number(Number(paymentData.payment_amount ?? orderData.order_amount ?? 0).toFixed(2));

      if (actualPaid !== expectedAmount) {
        console.error(`Webhook amount mismatch for ${orderId}: Expected ₹${expectedAmount}, got ₹${actualPaid}`);
        const { error: failErr } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            amount_paid: actualPaid,
            raw_webhook_payload: payload,
          })
          .eq('id', payment.id);

        if (failErr) console.error('Failed to update payment status on mismatch:', failErr);

        return new Response(JSON.stringify({
          error: `Exact amount mismatch: Expected ₹${expectedAmount}, received ₹${actualPaid}`,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update payments record
      const { error: updatePayErr } = await supabase
        .from('payments')
        .update({
          status: 'success',
          amount_paid: actualPaid,
          gateway_payment_id: cfPaymentId,
          gateway_signature: signature,
          verified_at: new Date().toISOString(),
          raw_webhook_payload: payload,
        })
        .eq('id', payment.id);

      if (updatePayErr) {
        console.error('Database error updating payments table:', updatePayErr);
        return new Response(JSON.stringify({ error: 'Failed to update payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update teams record
      if (payment.registration_type === 'team') {
        const { error: updateTeamErr } = await supabase
          .from('teams')
          .update({ payment_status: 'success' })
          .eq('id', payment.registration_id);

        if (updateTeamErr) {
          console.error('Database error updating teams table:', updateTeamErr);
          return new Response(JSON.stringify({ error: 'Failed to update team payment status' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ received: true, status: 'success' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Handle Payment Failure
    if (paymentStatus === 'FAILED' || eventType === 'PAYMENT_FAILED_WEBHOOK') {
      const { error: failPayErr } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          raw_webhook_payload: payload,
        })
        .eq('id', payment.id);

      if (failPayErr) {
        console.error('Database error recording payment failure:', failPayErr);
        return new Response(JSON.stringify({ error: 'Failed to update payment failure' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (payment.registration_type === 'team') {
        const { error: failTeamErr } = await supabase
          .from('teams')
          .update({ payment_status: 'failed' })
          .eq('id', payment.registration_id);

        if (failTeamErr) {
          console.error('Database error updating team failure status:', failTeamErr);
        }
      }

      return new Response(JSON.stringify({ received: true, status: 'failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 8. Treat drop/cancel as a terminal failure — otherwise it sits 'pending'
    // for the full 30-min grace window and blocks retries for no reason.
    const terminalNegative = ['USER_DROPPED', 'CANCELLED', 'VOID'];
    const isTerminalNegative =
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK' ||
      eventType === 'PAYMENT_CANCELLED_WEBHOOK' ||
      terminalNegative.includes((paymentStatus || '').toUpperCase());

    if (isTerminalNegative) {
      await supabase
        .from('payments')
        .update({ status: 'failed', raw_webhook_payload: payload })
        .eq('id', payment.id);

      if (payment.registration_type === 'team') {
        await supabase
          .from('teams')
          .update({ payment_status: 'failed' })
          .eq('id', payment.registration_id);
      }

      return new Response(JSON.stringify({ received: true, status: 'failed', reason: eventType || paymentStatus }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 9. Genuinely non-terminal events (e.g. PENDING) — log only, leave status alone
    await supabase
      .from('payments')
      .update({ raw_webhook_payload: payload })
      .eq('id', payment.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook processing exception:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook processing error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
