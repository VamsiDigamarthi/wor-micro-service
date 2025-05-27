import UserModel from "../modals/UserModal.js";
import logger from "../utils/logger.js";
import { publishToRedis, subscribeToRedis } from "./redisClient.js";

export const listenToRideEvents = () => {
  // subscribeToRedis("ride.fetchcaptains", async (payload) => {
  //   const { minDistance, maxDistance, order } = payload;
  //   logger.info(
  //     `📥 Event Received: ride.fetchcaptains ${minDistance} ${maxDistance} ${order?._id}`
  //   );
  //   try {
  //     const captains = await UserModel.find({}).select("_id mobile fbtoken");
  //     logger.info(`✅ Captains found: ${captains?.length}`);
  //     if (captains?.length)
  //       publishToRedis("ride.sharedToCaptain", { captains, order });
  //   } catch (err) {
  //     logger.error("❌ Failed to fetch captains:", err);
  //   }
  // }); not use this event replace this rabbitmq
};
