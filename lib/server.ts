import { createServerClient } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse, serialize } from 'cookie';

export function createClient(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '') || null;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookies = parse(req.headers.cookie || '');
          return cookies[name];
        },
        set(name: string, value: string, options?: any) {
          const cookie = serialize(name, value, options);
          res.setHeader('Set-Cookie', cookie);
        },
        remove(name: string, options?: any) {
          const cookie = serialize(name, '', { ...options, maxAge: -1 });
          res.setHeader('Set-Cookie', cookie);
        },
      },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}
