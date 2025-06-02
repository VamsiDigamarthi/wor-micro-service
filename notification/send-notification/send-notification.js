import admin from "../firebase-config.js";
import logger from "../utils/logger.js";

export const sendNotification = async ({
  fcmToken,
  title,
  body,
  data = {},
}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: data, // optional - any key-value data
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info("✅ Notification sent successfully:", response);
  } catch (error) {
    logger.error("❌ Error sending notification:", error);
  }
};
