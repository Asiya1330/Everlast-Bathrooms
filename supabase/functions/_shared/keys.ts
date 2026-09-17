// Supabase now injects API keys into Edge Functions as JSON dictionaries
// (SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS, keyed by key id) instead
// of the older single-string SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
// This picks the first value out of whichever form is present, so the
// function keeps working whether the project has rotated to the new
// JWT-signing-key format or not.

function firstValue(jsonDict: string): string {
  try {
    const parsed = JSON.parse(jsonDict);
    const values = Object.values(parsed);
    return typeof values[0] === 'string' ? (values[0] as string) : '';
  } catch {
    return '';
  }
}

export function getPublishableKey(): string {
  const dict = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (dict) return firstValue(dict);
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
}

export function getSecretKey(): string {
  const dict = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (dict) return firstValue(dict);
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}
