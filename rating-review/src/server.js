import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import mongoose from "mongoose";
import Redis from "ioredis";
import errorHandler from "./middlewares/errorHandler.js";
import RatingRoute from "./routes/rating-route.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT || 3007;

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

app.use("/api/rating", RatingRoute);

function startHTTPServer() {
  app.listen(PORT, () => {
    logger.info(`Rating-Review Service is running on port ${PORT}`);
  });
}

async function startServer() {
  try {
    // await setupRabbitMQConsumers();
    startHTTPServer();
  } catch (error) {
    logger.error("Failed to start the server", error);
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
