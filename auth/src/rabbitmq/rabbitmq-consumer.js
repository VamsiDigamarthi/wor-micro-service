import { ratingEventHandler } from "../event-handler/rating-event-handler.js";
import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";

export async function setupRabbitMQConsumers() {
  await connectToRabbitMQ();

  await ratingConsumer();
}

const ratingConsumer = async () => {
  await consumeEvent({
    routingKeys: ["rating.postFromRatingSer"],
    queueName: "authRatingService_mainQueue",
    callback: ratingEventHandler,
  });
};
