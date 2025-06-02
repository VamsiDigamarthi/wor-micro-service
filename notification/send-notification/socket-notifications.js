import FbToken from "../modal/fbTokenUsers.js";
import logger from "../utils/logger";
import { sendNotification } from "./send-notification.js";

export const rideAcceptNotification = async (order) => {
  let userId = order?.head?._id;

  let title = "Your Ride Has Been Accepted";
  let body = `Captain ${
    order?.acceptCaptain?.name || "has"
  } accepted your ride request. Get ready!`;

  try {
    const user = FbToken.findOne(userId);

    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "arrived",
      order: JSON.stringify(order),
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ried accept  notification successfully");
  } catch (error) {
    logger.error("❌ failed to send ride accept notification", err);
  }
};

export const rideArrivedNotification = async (order) => {
  let userId = order?.head?._id;
  const title = "Your Ride Has Arrived!";
  const body = `Captain ${
    order?.acceptCaptain?.name || ""
  } is waiting at your pickup location. Please meet them soon.`;

  try {
    const user = FbToken.findOne(userId);

    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "arrived",
      order: JSON.stringify(order),
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ried Arrived  notification successfully");
  } catch (error) {
    logger.error("❌ failed to send ride arrived notification", err);
  }
};

// ride otp verification

export const rideOtpVerifiedNotification = async (order) => {
  let userId = order?.head?._id;
  const title = "Ride Started";
  const body = `Your OTP has been verified. Captain ${
    order?.acceptCaptain?.name || ""
  } has started your ride. Sit back, relax, and have a safe journey!`;

  try {
    const user = FbToken.findOne(userId);

    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "arrived",
      order: JSON.stringify(order),
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ried Otp verified notification successfully");
  } catch (error) {
    logger.error("❌ failed to send ride Otp verified  notification", err);
  }
};

// ride completion

export const rideCompletedNotification = async (order) => {
  let userId = order?.head?._id;
  const title = "Ride Completed";
  const body =
    "Your ride has been successfully completed. Thank you for choosing us! We hope you had a safe and pleasant journey.";

  try {
    const user = FbToken.findOne(userId);

    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "arrived",
      order: JSON.stringify(order),
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ried Completed notification successfully");
  } catch (error) {
    logger.error("❌ failed to send ride Completed  notification", err);
  }
};

export const middleDropNotification = async (order) => {
  let userId = order?.head?._id;
  const title = "Your Journey Was Cut Short";
  const body =
    "We noticed you left the ride early. Your safety matters — feel free to book again and let us help you reach your destination.";

  try {
    const user = FbToken.findOne(userId);

    let fcmToken = user.fbToken;
    let data = {
      title,
      screen: "arrived",
      order: JSON.stringify(order),
    };

    await sendNotification({
      body,
      fcmToken,
      title,
      data,
    });

    logger.info("✅ Ried Otp Middle drop notification successfully");
  } catch (error) {
    logger.error("❌ failed to send ride middle drop notification", err);
  }
};
