import { createClient } from '@supabase/supabase-js'

// The publishable key is designed to ship in client code — row-level
// security in the database is what controls who can read or write what.
const SUPABASE_URL = 'https://yqbbcxrppwcuuuzoxdxp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_XXjYdJPUWp3WGpLoZnwKTw_mVWznD3l'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
