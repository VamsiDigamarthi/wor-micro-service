import FbToken from "../modal/fbTokenUsers.js";
import { sendNotification } from "../send-notification/send-notification.js";
import logger from "../utils/logger.js";

export const rideChatEventHandler = async (event, routingKey) => {
  try {
    switch (routingKey) {
      case "ridechat.newmessage":
        return await newRideMessageNotification(event);
      default:
        logger.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    logger.error(`❌ Error handling ${routingKey}:`, err);
  }
};

const newRideMessageNotification = async (event) => {
  const { sender, userId, message } = event;

  let tit = sender === "user" ? "Captain" : "Customer";

  try {
    const user = FbToken.findOne(userId);
    let title = `Message from ${tit}`;
    let body = message;
    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "chat",
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ride chat new message notification successfully");
  } catch (error) {
    logger.error("❌ failed to fetch ride chat fb token", err);
  }
};
