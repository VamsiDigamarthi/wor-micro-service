import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";

export const setupRabbitMqConsumers = async () => {
  await connectToRabbitMQ();

  await supportChatConsumer();
};

const supportChatConsumer = async () => {
  await consumeEvent({
    routingKeys: ["support.chatcreate"],
    queueName: "supportchat_mainQueue",
    // callback: ratingEventHandler,
  });
};
