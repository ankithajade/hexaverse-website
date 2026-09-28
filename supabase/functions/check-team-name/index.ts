// Supabase Edge Function: check-team-name
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
    const url = new URL(req.url);
    let event_slug = url.searchParams.get('event_slug');
    let team_name = url.searchParams.get('team_name');

    if (req.method === 'POST') {
      const body = await req.json();
      event_slug = event_slug || body.event_slug;
      team_name = team_name || body.team_name;
    }

    if (!event_slug || !team_name) {
      return new Response(JSON.stringify({ error: 'event_slug and team_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normName = team_name.trim().toLowerCase();

    const PENDING_GRACE_MINUTES = 30; // keep in sync with create-registration

    const { data: existing } = await supabase
      .from('teams')
      .select('id, payment_status, created_at')
      .eq('event_slug', event_slug)
      .eq('team_name_norm', normName)
      .maybeSingle();

    let taken = false;
    if (existing) {
      if (existing.payment_status === 'success') {
        taken = true;
      } else if (existing.payment_status === 'failed') {
        taken = false; // failed attempts free up the name immediately
      } else {
        // 'pending' — only treat as taken while inside the grace window;
        // create-registration will double-check with Cashfree on actual submit
        const ageMs = Date.now() - new Date(existing.created_at).getTime();
        taken = ageMs < PENDING_GRACE_MINUTES * 60 * 1000;
      }
    }

    return new Response(
      JSON.stringify({
        event_slug,
        team_name,
        available: !taken,
        taken,
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
