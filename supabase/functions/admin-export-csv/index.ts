// Supabase Edge Function: admin-export-csv
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function safeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

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

    // Columns: Team Short ID, Team Name, Member Name, Email, Phone, Semester, Section, Department, Cycle, Roll Number, USN, Role, Payment Status, Registered At
    csvLines.push('Type,Event Slug,Short ID,Team Name,Name,Email,Phone,Semester,Section,Department,Cycle,Roll Number,USN,Is Lead,Payment Status,Registered At');

    if (!event_slug) {
      // Export all registrations
      const { data: workshops } = await supabase.from('workshop_registrations').select('*').order('created_at', { ascending: false });
      const { data: teams } = await supabase.from('teams').select('*, team_members(*)').order('created_at', { ascending: false });

      workshops?.forEach((w) => {
        csvLines.push([
          safeCsvCell('Workshop'),
          safeCsvCell(w.event_slug),
          safeCsvCell(''),
          safeCsvCell(''),
          safeCsvCell(w.name),
          safeCsvCell(w.email),
          safeCsvCell(w.phone),
          safeCsvCell(`Sem ${w.semester}`),
          safeCsvCell(w.section || ''),
          safeCsvCell(w.selected_dept || ''),
          safeCsvCell(w.cycle || ''),
          safeCsvCell(w.roll_number || ''),
          safeCsvCell(w.usn || ''),
          safeCsvCell('Lead'),
          safeCsvCell(w.status || 'confirmed'),
          safeCsvCell(w.created_at),
        ].join(','));
      });

      teams?.forEach((t) => {
        const shortId = t.short_id ? t.short_id.toUpperCase() : `legacy-${(t.id || '').replace(/-/g, '').slice(0, 8)}`;
        const members = (t.team_members || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

        members.forEach((m: any) => {
          csvLines.push([
            safeCsvCell('Team'),
            safeCsvCell(t.event_slug),
            safeCsvCell(shortId),
            safeCsvCell(t.team_name),
            safeCsvCell(m.name),
            safeCsvCell(m.email || ''),
            safeCsvCell(m.phone || ''),
            safeCsvCell(m.semester ? `Sem ${m.semester}` : ''),
            safeCsvCell(m.section || ''),
            safeCsvCell(m.dept || ''),
            safeCsvCell(m.cycle || ''),
            safeCsvCell(m.roll_number || ''),
            safeCsvCell(m.usn || ''),
            safeCsvCell(m.is_lead ? 'Yes' : 'No'),
            safeCsvCell(t.payment_status || 'pending'),
            safeCsvCell(t.created_at),
          ].join(','));
        });
      });
    } else {
      const { data: event } = await supabase.from('events').select('*').eq('slug', event_slug).single();
      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (event.event_type === 'workshop') {
        const { data: workshops } = await supabase.from('workshop_registrations').select('*').eq('event_slug', event_slug).order('created_at', { ascending: false });
        workshops?.forEach((w) => {
          csvLines.push([
            safeCsvCell('Workshop'),
            safeCsvCell(w.event_slug),
            safeCsvCell(''),
            safeCsvCell(''),
            safeCsvCell(w.name),
            safeCsvCell(w.email),
            safeCsvCell(w.phone),
            safeCsvCell(`Sem ${w.semester}`),
            safeCsvCell(w.section || ''),
            safeCsvCell(w.selected_dept || ''),
            safeCsvCell(w.cycle || ''),
            safeCsvCell(w.roll_number || ''),
            safeCsvCell(w.usn || ''),
            safeCsvCell('Lead'),
            safeCsvCell(w.status || 'confirmed'),
            safeCsvCell(w.created_at),
          ].join(','));
        });
      } else {
        const { data: teams } = await supabase.from('teams').select('*, team_members(*)').eq('event_slug', event_slug).order('created_at', { ascending: false });
        teams?.forEach((t) => {
          const shortId = t.short_id ? t.short_id.toUpperCase() : `legacy-${(t.id || '').replace(/-/g, '').slice(0, 8)}`;
          const members = (t.team_members || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

          members.forEach((m: any) => {
            csvLines.push([
              safeCsvCell('Team'),
              safeCsvCell(t.event_slug),
              safeCsvCell(shortId),
              safeCsvCell(t.team_name),
              safeCsvCell(m.name),
              safeCsvCell(m.email || ''),
              safeCsvCell(m.phone || ''),
              safeCsvCell(m.semester ? `Sem ${m.semester}` : ''),
              safeCsvCell(m.section || ''),
              safeCsvCell(m.dept || ''),
              safeCsvCell(m.cycle || ''),
              safeCsvCell(m.roll_number || ''),
              safeCsvCell(m.usn || ''),
              safeCsvCell(m.is_lead ? 'Yes' : 'No'),
              safeCsvCell(t.payment_status || 'pending'),
              safeCsvCell(t.created_at),
            ].join(','));
          });
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
