import { ratingEventHandler } from "../event-handlers/rating-event-handler.js";
import { unifiedHandler } from "../event-handlers/ride-event-handler.js";
import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";

export async function setupRabbitMQConsumers() {
  await connectToRabbitMQ();

  await setupRideConsumer();
  await setupRatingConsumer();
}

const setupRideConsumer = async () => {
  await consumeEvent({
    routingKeys: [
      "captain.onDuty",
      "captain.offDuty",
      "captain.locationUpdate",
    ],
    queueName: "rideService_mainQueue",
    callback: unifiedHandler,
  });
};

const setupRatingConsumer = async () => {
  await consumeEvent({
    routingKeys: ["rating.post"],
    queueName: "ratingService_mainQueue",
    callback: ratingEventHandler,
  });
};
