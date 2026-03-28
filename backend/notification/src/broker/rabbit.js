import amqp from "amqplib";
import _config from "../config/config.js";

let channel, connection;

export async function connect() {
  connection = await amqp.connect(_config.RABBITMQ_URL);
  channel = await connection.createChannel();

  console.log("Connected to RabbitMQ");
}

export async function publishToQueue(queueName, data) {

    await channel.assertQueue(queueName, { durable: true });

    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));

    console.log(`Message sent to queue ${queueName}`);
}


export async function subscribeToQueue(queueName, callback) {

    await channel.assertQueue(queueName, { durable: true });

     channel.consume(queueName,async (msg) => {
       await callback(JSON.parse(msg.content.toString()));
       await channel.ack(msg);
    });
}