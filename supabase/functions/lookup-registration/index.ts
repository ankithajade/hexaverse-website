// Supabase Edge Function: lookup-registration
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
    const body = await req.json();
    const { email, phone, event_slug } = body;

    if (!email || !phone || !event_slug) {
      return new Response(JSON.stringify({ error: 'email, phone, and event_slug are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check workshop registrations first
    const { data: workshop } = await supabase
      .from('workshop_registrations')
      .select('*')
      .eq('event_slug', event_slug)
      .eq('email', cleanEmail)
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (workshop) {
      return new Response(
        JSON.stringify({
          found: true,
          registration_type: 'workshop',
          data: workshop,
          editable: false,
          message: 'Workshop registrations are confirmed. Contact organizers for any modifications.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check team members by email or phone, then find team
    const { data: member } = await supabase
      .from('team_members')
      .select('team_id')
      .or(`email.ilike.${cleanEmail},phone.eq.${cleanPhone}`)
      .limit(1)
      .maybeSingle();

    if (member) {
      const { data: team } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', member.team_id)
        .eq('event_slug', event_slug)
        .maybeSingle();

      if (team) {
        if (team.payment_status === 'success') {
          return new Response(
            JSON.stringify({
              found: true,
              registration_type: 'team',
              payment_status: 'success',
              editable: false,
              message: 'Payment has been completed. Edits are locked. Please contact the organizers for support.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            found: true,
            registration_type: 'team',
            payment_status: team.payment_status,
            editable: true,
            data: team,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ found: false, message: 'No registration found for provided credentials' }), {
      status: 444,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
