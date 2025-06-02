import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";
// import { connectToRabbitMQ, consumeEvent } from "./rabbitmq/rabbitmq.js";
import ChatRoute from "./routes/chat-route.js";
import { setupRabbitMqConsumers } from "./rabbitmq/rabbitmq-consumer.js";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   logger.info(`Received ${req.method} request to ${req.url}`);
//   logger.info(`Request body, ${req.body}`);
//   next();
// });

app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

app.use("/api/chat", ChatRoute);

async function startServer() {
  try {
    await setupRabbitMqConsumers();

    app.listen(PORT, () => {
      logger.info(`Support Chat is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 Unhandled Rejection detected!");

  if (reason instanceof Error) {
    logger.error("Reason message:", reason.message);
    logger.error("Stack trace:", reason.stack);
  } else {
    logger.error("Reason:", reason);
  }

  logger.debug("Promise details (may be limited):", promise?.toString?.());
});
