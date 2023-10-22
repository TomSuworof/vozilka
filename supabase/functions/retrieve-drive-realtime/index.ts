import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Kafka } from 'https://esm.sh/@upstash/kafka'
import { corsHeaders } from '../_shared/cors.ts'
import { credentials } from '../_shared/credentials.ts'

const kafka = new Kafka({
  url: credentials.KAFKA_URL,
  username: credentials.KAFKA_USERNAME,
  password: credentials.KAFKA_PASSWORD
})

const consumer = kafka.consumer()

const encoder = new TextEncoder();

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(
        'ok',
            {
              headers: corsHeaders
            }
        );
    }

    let data = await consumer.consume({
        consumerGroupId: "group_1",
        instanceId: "instance_1",
        topics: ['vozilka-server.public.drives'],
        autoOffsetReset: "earliest",
        timeout: 10000
    })

    if (data.length > 0) {
        let dataArr = []
        console.log(data)
        for (let i = 0; i < data.length; i++) {
            let newDrive = JSON.parse(data[i].value)["payload"]["after"] 
            dataArr.push(newDrive)
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
