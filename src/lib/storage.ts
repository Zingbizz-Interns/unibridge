import 'server-only'

import { createClient } from '@supabase/supabase-js'

export const storageAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const storageBuckets = {
  verification: process.env.SUPABASE_BUCKET_VERIFICATION!,
  publicDocuments: process.env.SUPABASE_BUCKET_PUBLIC!,
  stories: process.env.SUPABASE_BUCKET_STORIES!,
}
