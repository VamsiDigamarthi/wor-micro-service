import { fbTokenEventHandler } from "../event-handler/fb-token-event-handler.js";
import { rideChatEventHandler } from "../event-handler/ride-chat-event-handler.js";
import { rideRelatedEventHandler } from "../event-handler/ride-event-handler.js";
import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";

export async function setupRabbitMQConsumers() {
  await connectToRabbitMQ();

  await storeFbToken();
  await setupRideNotificationConsumer();
  await setupRideChatNotificationConsumer();
}

const storeFbToken = async () => {
  await consumeEvent({
    routingKeys: ["fbToken.storeFbToken"],
    queueName: "fbTokenstored_mainQueue",
    callback: fbTokenEventHandler,
  });
};

const setupRideChatNotificationConsumer = async () => {
  await consumeEvent({
    routingKeys: ["ridechat.newmessage"],
    queueName: "rideChat_mainQueue",
    callback: rideChatEventHandler,
  });
};

const setupRideNotificationConsumer = async () => {
  await consumeEvent({
    routingKeys: ["captain.onDuty"],
    queueName: "rideRelated_mainQueue",
    callback: rideRelatedEventHandler,
  });
};
