import amqp from "amqplib";
import logger from "../utils/logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "wor_events";
const EXCHANGE_TYPE = "direct"; // Changed from topic to direct for routing per event type

// Connect and initialize exchange
export async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true,
    });

    logger.info("✅ Connected to RabbitMQ and exchange declared");
    return channel;
  } catch (e) {
    logger.error("❌ Error connecting to RabbitMQ", e);
  }
}

// Publish an event with persistence
export async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const buffer = Buffer.from(JSON.stringify(message));

  channel.publish(EXCHANGE_NAME, routingKey, buffer, {
    persistent: true, // Ensures message survives broker restart
  });

  logger.info(`📤 Event published to ${routingKey}`);
}

// Consume with a named, durable, non-exclusive queue
export async function consumeEvent({ routingKey, callback, queueName }) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  await channel.assertQueue(queueName, {
    durable: true, // Queue survives restarts
    exclusive: false, // Multiple instances can share this queue
    autoDelete: false, // Queue won't auto-delete on disconnect
  });

  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  channel.consume(queueName, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg); // Acknowledge message (so it won't be re-queued)
    }
  });

  logger.info(`🔔 Subscribed to ${routingKey} on queue ${queueName}`);
}
