import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const clientUrl = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { car_names, source, destination, departure_time, arrival_time } = await req.json()
  
    const supabase = createClient(
        clientUrl,
        anonKey,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const {data, error} = await supabase
        .from('drives')
        .select()
        .in('car_name', car_names)
        .like('source', `%${source}%`)
        .like('destination', `%${destination}%`)
        .gte('departure_time', departure_time)
        .lte('arrival_time', arrival_time)
  
    if (error) {
        console.error(error)
        return new Response(
            JSON.stringify(error),
            {
                status: 422,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        ) 
    } else {
        console.log(data)
        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        )
    }
})
