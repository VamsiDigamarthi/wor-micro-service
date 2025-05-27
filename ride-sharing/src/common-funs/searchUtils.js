import OnDutyCaptain from "../modals/duty-change-users.js";
import OrderModal from "../modals/ride-modal.js";
import logger from "../utils/logger.js";
import { getFormattedDateTime } from "./date-formate.js";

export const updateSocketPlaceTime = async (orderId) => {
  const { formattedTime } = getFormattedDateTime();
  return await OrderModal.findByIdAndUpdate(
    orderId,
    { socketPlaceTime: formattedTime },
    { new: true }
  );
};

export const cancelOrderIfNeeded = async (updatedOrder, orderId) => {
  if (updatedOrder?.status !== "cancelled") {
    await OrderModal.findByIdAndUpdate(
      orderId,
      { status: "cancelled" },
      { new: true }
    );
    logger.info(`⛔ Stopping retry: Order ${orderId} marked as cancelled.`);
  }
};

export const shouldStopRetrying = (status) =>
  ["accept", "completed", "cancelled"].includes(status);

export const logSearchRange = (attempt, min, max, orderId) => {
  logger.info(
    `📡 [Attempt ${attempt}] Searching captains (Range: ${min}-${max} km) for order ${orderId}`
  );
};

export const fetchCaptains = async () => {
  return await OnDutyCaptain.find().select("_id mobile fbtoken");
};
