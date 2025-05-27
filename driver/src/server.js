import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import Redis from "ioredis";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";
import DriverRoute from "./routes/driver-route.js";
import { setupRabbitMQConsumers } from "./rabbitmq/rabbitmq-consumer.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    // listenToRideEvents();
    logger.info("Connected to mongodb");
  })
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(
  "/api/captain",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  DriverRoute
);

async function startServer() {
  try {
    await setupRabbitMQConsumers();

    app.listen(PORT, () => {
      logger.info(`Driver service is running on port ${PORT}`);
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
