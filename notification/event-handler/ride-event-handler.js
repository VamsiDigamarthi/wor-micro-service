import logger from "../utils/logger.js";

export const rideRelatedEventHandler = async (event, routingKey) => {
  try {
    switch (routingKey) {
      case "captain.onDuty":
        return await handleOndutyCaptains(event);

      default:
        logger.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    logger.error(`❌ Error handling ${routingKey}:`, err);
  }
};
