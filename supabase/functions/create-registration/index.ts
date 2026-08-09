// Supabase Edge Function: create-registration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USN_REGEX = /^1DB(23|24|25)(CS|IS|AD|CI|EC|EE)(00[1-9]|0[1-9]\d|[1-9]\d{2})$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event_slug, registrant, team_members, team_name } = body;

    if (!event_slug) {
      return new Response(JSON.stringify({ error: 'event_slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Read event config from DB
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('slug', event_slug)
      .single();

    if (eventErr || !event) {
      return new Response(JSON.stringify({ error: 'Invalid or missing event' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!event.is_open) {
      return new Response(JSON.stringify({ error: 'Registrations for this event are closed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Handle Workshop (Individual, Free)
    if (event.event_type === 'workshop') {
      const { name, semester, usn, email, phone } = registrant || {};

      if (!name || !semester || !email || !phone) {
        return new Response(JSON.stringify({ error: 'Missing required workshop fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Server-side USN validation for Semesters 3, 5, 7
      if ([3, 5, 7].includes(Number(semester))) {
        if (!usn || !USN_REGEX.test(usn.trim())) {
          return new Response(JSON.stringify({ error: `Invalid USN format for Semester ${semester}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Check duplicates
      const { data: existingEmail } = await supabase
        .from('workshop_registrations')
        .select('id')
        .eq('event_slug', event_slug)
        .ilike('email', email.trim())
        .maybeSingle();

      if (existingEmail) {
        return new Response(JSON.stringify({ error: 'You have already registered for this workshop with this email' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (usn) {
        const { data: existingUsn } = await supabase
          .from('workshop_registrations')
          .select('id')
          .eq('event_slug', event_slug)
          .ilike('usn', usn.trim())
          .maybeSingle();

        if (existingUsn) {
          return new Response(JSON.stringify({ error: 'This USN is already registered for this workshop' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Insert workshop registration (status = confirmed, no payment needed)
      const { data: reg, error: regErr } = await supabase
        .from('workshop_registrations')
        .insert({
          event_slug,
          name: name.trim(),
          semester: Number(semester),
          usn: usn ? usn.trim().toUpperCase() : null,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          status: 'confirmed',
        })
        .select()
        .single();

      if (regErr) {
        return new Response(JSON.stringify({ error: regErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          is_free: true,
          message: 'Workshop registration confirmed',
          registration_id: reg.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Handle Team Event (Signature or Treasure Hunt)
    const members = team_members || [];
    const totalMembers = members.length;

    if (!team_name || !team_name.trim()) {
      return new Response(JSON.stringify({ error: 'Team name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate team size
    if (event.team_min && totalMembers < event.team_min) {
      return new Response(JSON.stringify({ error: `Minimum ${event.team_min} members required for ${event.title}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event.team_max && totalMembers > event.team_max) {
      return new Response(JSON.stringify({ error: `Maximum ${event.team_max} members allowed for ${event.title}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate members & USN format
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name || !m.usn) {
        return new Response(JSON.stringify({ error: `Member ${i + 1} requires Name and USN` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!USN_REGEX.test(m.usn.trim())) {
        return new Response(JSON.stringify({ error: `Member ${i + 1} (${m.name}) has an invalid USN format (${m.usn})` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check case-insensitive team name uniqueness
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('event_slug', event_slug)
      .eq('team_name_norm', team_name.trim().toLowerCase())
      .maybeSingle();

    if (existingTeam) {
      return new Response(JSON.stringify({ error: `Team name "${team_name}" is already taken for this event` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Server-side fee computation (never trust client fee!)
    const amount_expected = Number(event.fee_per_head) * totalMembers;

    // Create team
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({
        event_slug,
        team_name: team_name.trim(),
        team_size: totalMembers,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (teamErr) {
      return new Response(JSON.stringify({ error: teamErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert team members
    const memberRows = members.map((m, idx) => ({
      team_id: team.id,
      is_lead: idx === 0,
      name: m.name.trim(),
      usn: m.usn.trim().toUpperCase(),
      email: m.email ? m.email.trim().toLowerCase() : (idx === 0 ? registrant?.email : null),
      phone: m.phone ? m.phone.trim() : (idx === 0 ? registrant?.phone : null),
      position: idx + 1,
    }));

    const { error: memErr } = await supabase.from('team_members').insert(memberRows);

    if (memErr) {
      // Clean up created team if members failed
      await supabase.from('teams').delete().eq('id', team.id);
      return new Response(JSON.stringify({ error: memErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create payments row
    const mockOrderId = `ORD_${event_slug}_${team.id.slice(0, 8)}_${Date.now()}`;
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        registration_type: 'team',
        registration_id: team.id,
        amount_expected,
        currency: 'INR',
        status: 'created',
        gateway: 'mock_gateway',
        gateway_order_id: mockOrderId,
      })
      .select()
      .single();

    if (payErr) {
      return new Response(JSON.stringify({ error: payErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update team with payment reference
    await supabase.from('teams').update({ payment_ref: payment.id }).eq('id', team.id);

    return new Response(
      JSON.stringify({
        success: true,
        is_free: false,
        payment_reference: payment.id,
        gateway_order_id: mockOrderId,
        amount_expected,
        team_id: team.id,
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
