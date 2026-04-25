import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eumqfazzjeuvwgdecxyr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bXFmYXp6amV1dndnZGVjeHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzI1NDcsImV4cCI6MjA5MjcwODU0N30.7SozbIwiRxUMa9g-LUlj72eOILdYu3ZBpVmLSrOXmR8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
