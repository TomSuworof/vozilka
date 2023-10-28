import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Kafka } from 'https://esm.sh/@upstash/kafka'
import { corsHeaders } from '../_shared/cors.ts'
import { credentials } from '../_shared/credentials.ts'

const clientUrl = Deno.env.get('SUPABASE_URL')
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

const kafka = new Kafka({
    url: credentials.KAFKA_URL,
    username: credentials.KAFKA_USERNAME,
    password: credentials.KAFKA_PASSWORD
})

const consumer = kafka.consumer()

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { car_names, source, destination, departure_time, arrival_time } = await req.json()

    console.log({ car_names, source, destination, departure_time, arrival_time })

    const supabase = createClient(
        clientUrl,
        anonKey,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const data = await consumer.consume({
        consumerGroupId: "group_1",
        instanceId: "instance_1",
        topics: ['vozilka-server.public.drives'],
        autoOffsetReset: "earliest",
        timeout: 10000
    })

    if (data.length > 0) {
        console.log(data)
        
        const dataArr = data.map(el => JSON.parse(el.value)["payload"]["after"])

        const dataResponse = []

        for (let i = 0; i < dataArr.length; i++) {
            const { drive, error } = await supabase
                .from('drives')
                .select()
                .eq('id', dataArr[i]['id'])
                .in('car_name', car_names)
                .like('source', `%${source}%`)
                .like('destination', `%${destination}%`)
                .gte('departure_time', departure_time)
                .lte('arrival_time', arrival_time)

            if (error) {
                continue;
            }
        }

        console.log(dataArr)

        return new Response(
            JSON.stringify(dataArr),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        )
    } else {
        return new Response(
            JSON.stringify({"error": "no data"}),
            {
                status: 422,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            },
        ) 
    }
});
