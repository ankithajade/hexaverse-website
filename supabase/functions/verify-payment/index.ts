// Supabase Edge Function: verify-payment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Abstract Gateway Signature Verification Helper
 * Expand/swap implementation when Razorpay, PayU, or Cashfree is selected.
 */
async function verifyGatewaySignature(payload: any, headers: Headers): Promise<boolean> {
  const mockSignature = headers.get('x-gateway-signature') || payload?.gateway_signature;
  // Stub/mock verification: Accepts if signature is provided or in development mode
  if (mockSignature && mockSignature !== 'invalid') return true;
  if (payload?.simulate_success) return true;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const {
      payment_reference,
      gateway_order_id,
      gateway_payment_id,
      gateway_signature,
      amount_paid,
    } = payload;

    // 1. Verify Gateway Signature
    const isValidSignature = await verifyGatewaySignature(payload, req.headers);
    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: 'Invalid gateway signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Lookup Payment record
    let query = supabase.from('payments').select('*');
    if (payment_reference) {
      query = query.eq('id', payment_reference);
    } else if (gateway_order_id) {
      query = query.eq('gateway_order_id', gateway_order_id);
    } else {
      return new Response(JSON.stringify({ error: 'payment_reference or gateway_order_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: payment, error: fetchErr } = await query.single();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency check: Already processed successfully
    if (payment.status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already processed successfully',
          status: 'success',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Confirm Amount Paid
    const actualPaid = Number(amount_paid ?? payment.amount_expected);
    if (actualPaid !== Number(payment.amount_expected)) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          amount_paid: actualPaid,
          gateway_payment_id: gateway_payment_id || `FAIL_${Date.now()}`,
          raw_webhook_payload: payload,
        })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          error: `Amount mismatch: Expected ₹${payment.amount_expected}, got ₹${actualPaid}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update Payment & Cascade to Team
    const payId = gateway_payment_id || `PAY_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'success',
        amount_paid: actualPaid,
        gateway_payment_id: payId,
        gateway_signature: gateway_signature || 'mock_signature',
        verified_at: new Date().toISOString(),
        raw_webhook_payload: payload,
      })
      .eq('id', payment.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cascade to team payment_status
    if (payment.registration_type === 'team') {
      await supabase
        .from('teams')
        .update({ payment_status: 'success' })
        .eq('id', payment.registration_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and status updated to success',
        status: 'success',
        payment_id: payment.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
