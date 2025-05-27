import { connectToRabbitMQ, consumeEvent } from "./rabbitMqClient.js";
import { handleChangehomePlaceStatus } from "./rabit-event-handler.js";

export async function setupRabbitMQConsumers() {
  await connectToRabbitMQ();

  const consumers = [
    {
      routingKey: "homeplace.changeActive",
      callback: handleChangehomePlaceStatus,
      queueName: "driverService_homePlaceStatus",
    },
  ];

  for (const consumer of consumers) {
    await consumeEvent(consumer);
  }
}
