// Supabase Edge Function: invite-crew
//
// Lets an admin create a new office/installer account without touching the
// Supabase Dashboard. Runs with the secret key (server-side only) to call
// the Auth Admin API, which the browser can never do directly.
//
// Deploy with: supabase functions deploy invite-crew
// No extra secrets needed beyond what Supabase injects automatically
// (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEYS, SUPABASE_SECRET_KEYS).
//
// Invited users receive Supabase's built-in "invite" email with a link to
// set their password. On acceptance, the `handle_new_user` trigger in
// supabase/schema.sql reads full_name/role out of user_metadata (set below)
// and creates their `profiles` row automatically.
//
// Invoked from the client via
// supabase.functions.invoke('invite-crew', { body: {...} })
// in src/lib/api.ts (see inviteCrewMember). Not exercised by this build
// session — deploy it, then test end to end.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { getPublishableKey, getSecretKey } from '../_shared/keys.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_PUBLISHABLE_KEY = getPublishableKey();
const SUPABASE_SECRET_KEY = getSecretKey();

interface InviteCrewPayload {
  fullName: string;
  email: string;
  role: 'admin' | 'office' | 'installer';
  phone?: string | null;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';

  // Identify the caller using their own JWT (publishable key + their access token).
  const callerClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !callerProfile || callerProfile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Only admins can invite crew members.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const payload: InviteCrewPayload = await req.json();

  if (!payload.email?.trim() || !payload.fullName?.trim()) {
    return new Response(JSON.stringify({ error: 'Full name and email are required.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    payload.email.trim().toLowerCase(),
    {
      data: {
        full_name: payload.fullName.trim(),
        role: payload.role,
      },
    }
  );

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // The handle_new_user trigger already inserted a profiles row from
  // user_metadata; patch in the phone number if one was provided.
  if (payload.phone?.trim() && invited?.user) {
    await adminClient
      .from('profiles')
      .update({ phone: payload.phone.trim() })
      .eq('id', invited.user.id);
  }

  return new Response(JSON.stringify({ userId: invited?.user?.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
