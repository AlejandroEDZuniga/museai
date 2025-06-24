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


// lib/server.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export function createSupabaseClientWithToken(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}

export function createClientPages(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  return createSupabaseClientWithToken(token);
}
