import OrderModal from "../modals/ride-modal.js";
import logger from "../utils/logger.js";

export async function ratingEventHandler(event, routingKey) {
  try {
    switch (routingKey) {
      case "rating.post":
        return await handleAddedRatingToEachOrder(event);
      default:
        console.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    console.error(`❌ Error handling ${routingKey}:`, err);
  }
}

const handleAddedRatingToEachOrder = async (event) => {
  const { orderId, rating } = event;
  logger.info(`ℹ️ RATING ADDED TO EACH ORDER EVENT HIT`);
  try {
    await OrderModal.findByIdAndUpdate(orderId, { $set: { rating } });

    logger.info(`ℹ️ RATING ADDED SUCCESSFULLY`);
  } catch (error) {
    logger.error(`❌Failed rating added each order ${orderId}: ${error}`, {
      stack: error.stack,
    });
  }
};
