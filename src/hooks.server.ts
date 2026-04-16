import type { Handle } from '@sveltejs/kit';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Cache static pages briefly
  const path = event.url.pathname;
  if (path === '/' || path === '/drinks' || path === '/house') {
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  }

  return response;
};
