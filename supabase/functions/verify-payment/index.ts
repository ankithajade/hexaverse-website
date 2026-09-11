// Supabase Edge Function: verify-payment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase server credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cashfreeAppId || !cashfreeSecretKey) {
      return new Response(JSON.stringify({
        error: 'Cashfree credentials are not configured on the server',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const order_id = payload?.order_id || payload?.gateway_order_id;
    const payment_reference = payload?.payment_reference;

    if (!order_id && !payment_reference) {
      return new Response(JSON.stringify({ error: 'order_id or payment_reference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Lookup Payment record in Supabase
    let query = supabase.from('payments').select('*');
    if (order_id) {
      query = query.eq('gateway_order_id', order_id);
    } else {
      query = query.eq('id', payment_reference);
    }

    const { data: payment, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: If already confirmed success, return verified team info immediately
    if (payment.status === 'success') {
      const { data: team } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', payment.registration_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          status: 'success',
          message: 'Payment already verified successfully',
          gateway_order_id: payment.gateway_order_id,
          gateway_payment_id: payment.gateway_payment_id,
          amount_paid: payment.amount_paid,
          team,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetOrderId = payment.gateway_order_id || order_id;

    // 2. Query Cashfree Sandbox API for authoritative Order status (API Version 2023-08-01)
    const orderRes = await fetch(`https://sandbox.cashfree.com/pg/orders/${targetOrderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData) {
      console.error('Failed to fetch Cashfree order:', orderData);
      return new Response(JSON.stringify({
        error: 'Failed to verify order with Cashfree',
        details: orderData?.message || 'Gateway communication error',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderStatus = orderData.order_status; // 'PAID' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

    // 3. Query Cashfree Payment Attempts for this Order
    let paymentAttempts: any[] = [];
    try {
      const paymentsRes = await fetch(`https://sandbox.cashfree.com/pg/orders/${targetOrderId}/payments`, {
        method: 'GET',
        headers: {
          'x-client-id': cashfreeAppId,
          'x-client-secret': cashfreeSecretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
      });
      if (paymentsRes.ok) {
        paymentAttempts = await paymentsRes.json();
      }
    } catch (e) {
      console.warn('Could not fetch Cashfree payment attempts:', e);
    }

    const successfulAttempt = Array.isArray(paymentAttempts)
      ? paymentAttempts.find((p: any) => p.payment_status === 'SUCCESS')
      : null;

    // 4. Process Status
    if (orderStatus === 'PAID') {
      // Must require a REAL Cashfree payment ID from a successful attempt
      const realPaymentId = successfulAttempt?.cf_payment_id
        ? String(successfulAttempt.cf_payment_id).trim()
        : null;

      if (!realPaymentId) {
        console.error(`Order ${targetOrderId} marked PAID by Cashfree but no successful payment attempt with cf_payment_id was returned.`);
        return new Response(JSON.stringify({
          success: false,
          status: 'pending',
          message: 'Payment confirmation is being synchronized with Cashfree. Please retry in a few seconds.',
          gateway_order_id: targetOrderId,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate payment method is UPI if method/group info is available
      const paymentGroup = (successfulAttempt.payment_group || '').toLowerCase();
      const hasUpiMethod = successfulAttempt.payment_method?.upi !== undefined;
      const isExplicitNonUpi = paymentGroup !== '' && paymentGroup !== 'upi' && !hasUpiMethod;

      if (isExplicitNonUpi) {
        console.error(`Rejected non-UPI payment method in verification (${paymentGroup}) for order ${targetOrderId}`);
        return new Response(JSON.stringify({
          error: 'Invalid payment method. Only UPI payments are accepted.',
          status: 'failed',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // EXACT amount equality check (must match expected fee exactly, never < or >)
      const expectedAmount = Number(Number(payment.amount_expected).toFixed(2));
      const orderPaidAmount = Number(Number(orderData.order_amount).toFixed(2));
      const attemptPaidAmount = successfulAttempt.payment_amount !== undefined
        ? Number(Number(successfulAttempt.payment_amount).toFixed(2))
        : orderPaidAmount;

      if (orderPaidAmount !== expectedAmount || attemptPaidAmount !== expectedAmount) {
        console.error(`Amount mismatch: expected ₹${expectedAmount}, got order ₹${orderPaidAmount}, attempt ₹${attemptPaidAmount}`);
        const { error: failPayErr } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            amount_paid: attemptPaidAmount,
            raw_webhook_payload: { order: orderData, payments: paymentAttempts },
          })
          .eq('id', payment.id);

        if (failPayErr) console.error('Error recording payment failure:', failPayErr);

        return new Response(JSON.stringify({
          error: `Exact amount mismatch: Expected ₹${expectedAmount}, received ₹${attemptPaidAmount}`,
          status: 'failed',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update payment record in database
      const { error: updatePayErr } = await supabase
        .from('payments')
        .update({
          status: 'success',
          amount_paid: attemptPaidAmount,
          gateway_payment_id: realPaymentId,
          verified_at: new Date().toISOString(),
          raw_webhook_payload: { order: orderData, payments: paymentAttempts },
        })
        .eq('id', payment.id);

      if (updatePayErr) {
        console.error('Database error updating payments table in verify-payment:', updatePayErr);
        return new Response(JSON.stringify({ error: 'Failed to update payment record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update team record in database
      if (payment.registration_type === 'team') {
        const { error: updateTeamErr } = await supabase
          .from('teams')
          .update({ payment_status: 'success' })
          .eq('id', payment.registration_id);

        if (updateTeamErr) {
          console.error('Database error updating teams table in verify-payment:', updateTeamErr);
          return new Response(JSON.stringify({ error: 'Failed to update team payment status' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Fetch updated team info (includes short_id)
      const { data: updatedTeam, error: teamFetchErr } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', payment.registration_id)
        .maybeSingle();

      if (teamFetchErr) {
        console.warn('Could not fetch updated team details:', teamFetchErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'success',
          message: 'Payment verified successfully',
          gateway_order_id: targetOrderId,
          gateway_payment_id: realPaymentId,
          amount_paid: attemptPaidAmount,
          team: updatedTeam,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (orderStatus === 'ACTIVE') {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'pending',
          message: 'Payment is pending. Please complete transaction in your UPI app.',
          gateway_order_id: targetOrderId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // EXPIRED or TERMINATED or FAILED
      const { error: failPayErr } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          raw_webhook_payload: { order: orderData, payments: paymentAttempts },
        })
        .eq('id', payment.id);

      if (failPayErr) console.error('Error recording payment failure:', failPayErr);

      if (payment.registration_type === 'team') {
        const { error: failTeamErr } = await supabase
          .from('teams')
          .update({ payment_status: 'failed' })
          .eq('id', payment.registration_id);

        if (failTeamErr) console.error('Error updating team failure status:', failTeamErr);
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          message: `Payment ${orderStatus.toLowerCase()}. Please try again.`,
          gateway_order_id: targetOrderId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    console.error('verify-payment exception:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
