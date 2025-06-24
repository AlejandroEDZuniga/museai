// import { createServerClient } from "@supabase/ssr";
// import { cookies, headers } from "next/headers";

// export function createClient() {
//   const cookieStore = cookies();
//   const headersList = headers();

//   const authHeader = headersList.get("authorization");
//   const accessToken = authHeader?.split(" ")[1];

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll();
//         },
//         setAll() {},
//       },
//       global: {
//         headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
//       },
//     }
//   );
// }

import { createServerClient } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';

import { parse, serialize } from 'cookie';

export function createClient(req: NextApiRequest, res: NextApiResponse) {
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
    }
  );
}
