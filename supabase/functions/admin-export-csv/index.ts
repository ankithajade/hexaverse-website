// Supabase Edge Function: admin-export-csv
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin allowlist
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (!admin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const event_slug = url.searchParams.get('event_slug');

    let csvLines: string[] = [];

    if (!event_slug) {
      // Export all registrations
      const { data: workshops } = await supabase.from('workshop_registrations').select('*');
      const { data: teams } = await supabase.from('teams').select('*, team_members(*)');

      csvLines.push('Type,Event Slug,Registration/Team ID,Name/Team Name,USN/Members,Email,Phone,Semester/Size,Payment Status,Created At');

      workshops?.forEach((w) => {
        csvLines.push(
          `"Workshop","${w.event_slug}","${w.id}","${w.name}","${w.usn || ''}","${w.email}","${w.phone}","${w.semester}","confirmed","${w.created_at}"`
        );
      });

      teams?.forEach((t) => {
        const memberList = (t.team_members || []).map((m: any) => `${m.name} (${m.usn})`).join('; ');
        csvLines.push(
          `"Team","${t.event_slug}","${t.id}","${t.team_name}","${memberList}","${t.team_members?.[0]?.email || ''}","${t.team_members?.[0]?.phone || ''}","${t.team_size}","${t.payment_status}","${t.created_at}"`
        );
      });
    } else {
      // Check event type
      const { data: event } = await supabase.from('events').select('*').eq('slug', event_slug).single();
      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (event.event_type === 'workshop') {
        const { data: workshops } = await supabase.from('workshop_registrations').select('*').eq('event_slug', event_slug);
        csvLines.push('Registration ID,Name,USN,Email,Phone,Semester,Status,Created At');
        workshops?.forEach((w) => {
          csvLines.push(
            `"${w.id}","${w.name}","${w.usn || ''}","${w.email}","${w.phone}","${w.semester}","${w.status}","${w.created_at}"`
          );
        });
      } else {
        const { data: teams } = await supabase.from('teams').select('*, team_members(*)').eq('event_slug', event_slug);
        csvLines.push('Team ID,Team Name,Team Size,Lead Name,Lead USN,Lead Email,Lead Phone,All Members,Payment Status,Created At');
        teams?.forEach((t) => {
          const lead = (t.team_members || []).find((m: any) => m.is_lead) || t.team_members?.[0];
          const memberList = (t.team_members || []).map((m: any) => `${m.name} (${m.usn})`).join('; ');
          csvLines.push(
            `"${t.id}","${t.team_name}","${t.team_size}","${lead?.name || ''}","${lead?.usn || ''}","${lead?.email || ''}","${lead?.phone || ''}","${memberList}","${t.payment_status}","${t.created_at}"`
          );
        });
      }
    }

    const csvContent = csvLines.join('\n');
    const filename = event_slug ? `${event_slug}_participants.csv` : 'all_participants.csv';

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
