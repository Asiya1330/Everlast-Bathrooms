// Shared CORS headers for Edge Functions invoked directly from the browser
// via supabase.functions.invoke(...). Without these, the browser's preflight
// OPTIONS request fails before the function body ever runs, and
// supabase-js surfaces that as the generic
// "Failed to send a request to the Edge Function".

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
