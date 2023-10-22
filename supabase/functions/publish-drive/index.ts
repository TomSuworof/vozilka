import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const clientUrl = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(
      'ok',
      {
          headers: corsHeaders
      }
    );
  }

  const { arrival_time, 
    car_name, 
    departure_time, 
    destination, 
    driver_user_id, 
    notes, 
    route, 
    source } = await req.json()
  
  const supabase = createClient(
    clientUrl,
    anonKey,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
  
  let { data, error } = await supabase
  .rpc('publish_drive', {
    arrival_time, 
    car_name, 
    departure_time, 
    destination, 
    driver_user_id, 
    notes, 
    route, 
    source
  })
  
  if (error) {
    console.error(error)
    return new Response(
      JSON.stringify(error),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      },
    ) 
  }
  else {
    console.log(data)
    
    return new Response(
      JSON.stringify(data || 'created'),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      },
    )
  }
})
