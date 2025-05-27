import {
  handleOffdutyCaptains,
  handleOndutyCaptains,
} from "../event-handlers/ride-event-handler.js";
import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";

export async function setupRabbitMQConsumers() {
  await connectToRabbitMQ();

  const consumers = [
    {
      routingKey: "captain.onDuty",
      callback: handleOndutyCaptains,
      queueName: "rideService_onDutyQueue",
    },
    {
      routingKey: "captain.offDuty",
      callback: handleOffdutyCaptains,
      queueName: "rideService_onDutyQueue",
    },
  ];

  for (const consumer of consumers) {
    await consumeEvent(consumer);
  }
}
