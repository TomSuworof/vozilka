import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Kafka } from 'https://esm.sh/@upstash/kafka'

const kafkaUrl = Deno.env.get('KAFKA_URL')
const kafkaUsername = Deno.env.get('KAFKA_USERNAME')
const kafkaPassword = Deno.env.get('KAFKA_PASSWORD')

const kafkaTopic = Deno.env.get('KAFKA_DRIVE_TOPIC')

console.log(kafkaUrl)
console.log(kafkaUsername)
console.log(kafkaPassword)
console.log(kafkaTopic)

const kafka = new Kafka({
    url: kafkaUrl,
    username: kafkaUsername,
    password: kafkaPassword,
})

const consumer = kafka.consumer()

const encoder = new TextEncoder();

serve(async (_) => {
    let timerId: number;
    const body = new ReadableStream({
        start(controller) {
            timerId = setInterval(async () => {
                consumer.consume({
                    consumerGroupId: "vozilka-group-0",
                    instanceId: "instance_1",
                    topics: [kafkaTopic],
                    autoOffsetReset: "earliest",
                }).then(data => {
                    if (data.length > 0) {
                        let newDrive = JSON.parse(data[0].value)["payload"]["after"] 
                        console.log(newDrive)
                        
                        const msg = encoder.encode(`data: ${JSON.stringify(newDrive)}\r\n\r\n`);
                        
                        controller.enqueue(msg)
                    }
                })
            }, 5000);
        },
        cancel() {
            if (typeof timerId === "number") {
                clearInterval(timerId);
            }
        },
    });
    return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
        },
    });
});
