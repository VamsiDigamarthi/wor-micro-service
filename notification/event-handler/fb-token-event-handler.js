import FbToken from "../modal/fbTokenUsers.js";
import logger from "../utils/logger.js";

export const fbTokenEventHandler = async (event, routingKey) => {
  try {
    switch (routingKey) {
      case "fbToken.storeFbToken":
        return await handleStoreFbToken(event);

      default:
        logger.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    logger.error(`❌ Error handling ${routingKey}:`, err);
  }
};

export const handleStoreFbToken = async (event) => {
  const { userId, mobile, fbToken } = event;

  if (!userId || !fbToken || !mobile) {
    logger.warn("Missing required fields: userId, mobile, or fbToken");
  }

  try {
    await FbToken.findOneAndUpdate(
      { userId },
      { fbToken, mobile },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    logger.info("✅ Firebase token stored:");
  } catch (err) {
    logger.error("❌ Error storing fbToken:", err);
  }
};
