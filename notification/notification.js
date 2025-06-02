import "dotenv/config";
import { connectToMongoDB } from "./db.js";
import { setupRabbitMQConsumers } from "./rabbitmq/rabbitmq-consumers.js";
import logger from "./utils/logger.js";

const startNotificationService = async () => {
  logger.info("🚀 Notification Service started");

  await connectToMongoDB();

  await setupRabbitMQConsumers();
};

startNotificationService();
