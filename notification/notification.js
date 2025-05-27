import { newOrderCreate } from "./event-handler.js";
import { connectToRabbitMQ, consumeEvent } from "./rabbitmq.js";
import logger from "./utils/logger.js";

const startNotificationService = async () => {
  logger.info("🚀 Notification Service started");

  await connectToRabbitMQ();
  await consumeEvent("new-order-create", newOrderCreate);
};

startNotificationService();
