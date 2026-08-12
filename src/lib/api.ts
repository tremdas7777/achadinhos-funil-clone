const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function getApiBase() {
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/achadinhos-api`;
  }
  return '/api';
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabaseUrl && supabaseKey) {
    headers.set('Authorization', `Bearer ${supabaseKey}`);
    headers.set('apikey', supabaseKey);
  }

  return fetch(`${getApiBase()}${path}`, { ...options, headers });
}

export function isLovableProduction() {
  return Boolean(supabaseUrl && supabaseKey);
}
