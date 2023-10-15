import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const clientUrl = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  const { drive_id, 
    passenger_id } = await req.json()
  
  const supabase = createClient(
    clientUrl,
    anonKey,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
  
  let { data, error } = await supabase
  .rpc('confirm_drive', {
    drive_id, 
    passenger_id
  })
  
  if (error) {
    console.error(error)
    return new Response(
      JSON.stringify(error),
      {
        status: 422,
        headers: { "Content-Type": "application/json" }
      },
    ) 
  }
  else {
    console.log(data)
    
    return new Response(
      JSON.stringify(data || 'confirmed'),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      },
    )
  }
})
