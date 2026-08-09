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

    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('event_slug', event_slug)
      .eq('team_name_norm', normName)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        event_slug,
        team_name,
        available: !existing,
        taken: !!existing,
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
