import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ueunorswpjoremzzgbho.supabase.co'
const supabaseKey = 'sb_publishable_vCyykqX7sBZRGKiaaM2WGg_7foGHq1q'

const supabaseClient= createClient(supabaseUrl, supabaseKey)

export default supabaseClient