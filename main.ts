import { serveDir } from 'jsr:@std/http/file-server';

const FINANCIAL_BASE   = Deno.env.get('FINANCIAL_BASE_URL') ?? '';
const FINANCIAL_SECRET = Deno.env.get('FINANCIAL_SECRET')   ?? '';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname.startsWith('/financial-api/')) {
    const path = url.pathname.replace('/financial-api', '') + url.search;
    const proxyHeaders = new Headers(req.headers);
    if (FINANCIAL_SECRET) proxyHeaders.set('Authorization', `Bearer ${FINANCIAL_SECRET}`);
    return fetch(`${FINANCIAL_BASE}${path}`, {
      method: req.method,
      headers: proxyHeaders,
    });
  }

  const resp = await serveDir(req, { fsRoot: 'dist', quiet: true });

  if (resp.status === 404) {
    const html = await Deno.readFile('./dist/index.html');
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  return resp;
});
