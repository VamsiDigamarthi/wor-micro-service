import { fetchCaptains } from "../common-funs/searchUtils.js";
import OrderModal from "../modals/ride-modal.js";
import {
  acceptOrderChangeDestinationServer,
  checkActiveOrder,
  checkAlreadyOrderAcceptOrNot,
  fetchAcceptOrdersService,
  fetchDayWiseEarnings,
  getAllPendingOrderByDistance,
  getHighDemandAreasService,
  orderCompletedService,
  orderVerifiedOtpService,
  todayEarningsService,
  updateAndFetchPopulatedOrder,
} from "../service/captain-ride-service.js";
import logger from "../utils/logger.js";
import { publishToRedis } from "../utils/redisPubSub.js";
import { sendResponse } from "../utils/send-error.js";

export const fetchActiveOrders = async (req, res) => {
  const { mobile, userId } = req.user;
  const { lng, lat, distance, currentData } = req.params || {};
  logger.info(`ℹ️CAPTAIN FETCH PENING ORDERS api hit ${mobile}`);

  const result = await getAllPendingOrderByDistance({
    currentData,
    distance,
    lat,
    lng,
    userId,
    mobile,
  });
  return sendResponse(
    res,
    result.status,
    result.message,
    result.error || null,
    {
      orders: result.orders,
    }
  );
};

export const acceptOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  const { location, distanceFromCaptainToPickUp } = req.body;
  logger.info(`ℹ️ACCEPT ORDER api hit ${mobile}`);

  try {
    const existingOrder = await checkActiveOrder(userId);
    if (existingOrder)
      return sendResponse(res, 200, "You already have an active order");

    const { status } = await checkAlreadyOrderAcceptOrNot({ orderId });

    const isOrderTaken = status === "accept" || status === "cancelled";
    if (isOrderTaken) {
      logger.warn(`⚠️ Order ${orderId} already accepted or cancelled`);
      return sendResponse(res, 400, "Order already accepted or cancelled.");
    }

    const updatedOrder = await updateAndFetchPopulatedOrder({
      orderId,
      userId,
      mobile,
      location,
      distanceFromCaptainToPickUp,
    });

    if (!updatedOrder) return sendResponse(res, 404, "Order not found");

    const captains = await fetchCaptains();
    // notify remainig captains some one accept the then remove this ride from order list
    publishToRedis("order.someOneAcceptOrder", {
      captains,
      orderId: updatedOrder?._id,
    });

    publishToRedis("order.captainAcceptOrder", {
      order: updatedOrder,
    });

    logger.info(`ℹ️ORDER ACCEPT SUCCESSFULLY ${mobile}`);
    return res.status(200).json({
      message: "Accept Order Successfully...!",
      order: updatedOrder,
    });
  } catch (error) {
    logger.error(`❌Accept order  Faield ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Accept order  Faield", error);
  }
};

export const otpVerification = async (req, res) => {
  const { mobile, userId } = req.user;
  const { otp, extraCharge, isbeforeReachPickupEnterOtp = false } = req.body;
  const { orderId } = req.params;
  logger.info(`ℹ️ ORDER OTP VERIFICATION api hit ${mobile}`);
  try {
    const order = await OrderModal.findById(orderId);
    if (!order) return sendResponse(res, 404, "Order not found");

    if (order.orderOtp?.toString() !== otp?.toString())
      return res.status(401).json({ message: "Invalid OTP" });

    const updatedOrder = await orderVerifiedOtpService({
      orderId,
      isbeforeReachPickupEnterOtp,
      extraCharge,
    });

    if (!updatedOrder) return sendResponse(res, 404, "Order not found");

    publishToRedis("order.otpVerified", {
      order: updatedOrder,
    });

    logger.info(`ℹ️ORDER OTP VERIFICATION SUCCESSFULLY ${mobile}`);
    return sendResponse(res, 200, "Order OTP verified..!", null, {
      order: updatedOrder,
    });
  } catch (error) {
    logger.error(`❌Order OTP Verification Failed ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Order OTP Verification Failed", error);
  }
};

export const orderCompleted = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️ORDER COMPLETED api hit ${mobile}`);

  try {
    const updatedOrder = await orderCompletedService({
      orderId: orderId,
    });

    if (!updatedOrder) return sendResponse(res, 404, "Order not found");

    publishToRedis("order.completed", {
      orderId: updatedOrder?._id,
    });

    logger.info(`ℹ️ORDER OTP VERIFICATION SUCCESSFULLY ${mobile}`);

    return sendResponse(res, 200, "Order Completed", null, {
      order: updatedOrder,
    });
  } catch (error) {
    logger.error(`❌Failed to completed order ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to completed order", error);
  }
};

export const fetchAcceptOrders = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ NO COMPLETED ORDER api hit ${mobile}`);
  try {
    const activeOrder = await fetchAcceptOrdersService(userId);
    return sendResponse(res, 200, "", null, { activeOrder: activeOrder ?? {} });
  } catch (error) {
    logger.error(`❌Failed to fetch active order ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to fetch active order", error);
  }
};

export const ordersDeclaine = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️ CANCELLED ORDER api hit ${mobile}`);
  try {
    await OrderModal.findByIdAndUpdate(
      { _id: orderId },
      { $push: { rejectedCaptaine: userId } }
    );

    return sendResponse(res, 200, "Order declined successfully.");
  } catch (error) {
    logger.error(`❌remaining order declaine Faield ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "remaining order declaine Faield", error);
  }
};

export const acceptChangeDestiona = async (req, res) => {
  const { mobile } = req.user;
  const { orderId, status } = req.body;
  logger.info(`ℹ️CHANGE DESTINATIN api hit ${mobile}`);
  try {
    const updatedOrder = await acceptOrderChangeDestinationServer({
      orderId,
      status,
    });
    return sendResponse(
      res,
      200,
      "Change destination status updated successfully",
      null,
      { updatedOrder: updatedOrder ?? {} }
    );
  } catch (error) {
    logger.error(`❌Failed to accept change destination ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to accept change destination", error);
  }
};

export const collectCash = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  const { isCashCollectOrPaymnet } = req.body;
  logger.info(`ℹ️CASH COLLECTED ORDER api hit ${mobile}`);
  try {
  } catch (error) {
    logger.error(
      `❌After ride finish to cash collected Faield ${mobile}: ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(
      res,
      500,
      "After ride finish to cash collected Faield",
      error
    );
  }
};

export const middleDrop = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️MIDDLE DROP ORDER api hit ${mobile}`);
  try {
    const existingOrder = await OrderModal.findById(orderId);
    if (!existingOrder) return sendResponse(res, 404, "Order not found");

    const order = await OrderModal.findOneAndUpdate(
      { _id: orderId },
      { $set: { middleDrop: !existingOrder.middleDrop } },
      { new: true }
    );

    // emit real time service to notify user
    publishToRedis("order.middle-drop", {
      order,
    });

    return sendResponse(res, 200, "middle drop request send to partner");
  } catch (error) {
    logger.error(`❌before completeride hit failed ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "before completeride hit failed", error);
  }
};

export const allCompletedOrders = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️COMPLETED ALL ORDERS api hit ${mobile}`);

  try {
    const orders = await OrderModal.find({
      acceptCaptain: userId,
      status: "completed",
    }).sort({ createdAt: -1 });

    return sendResponse(res, 200, "", null, { orders });
  } catch (error) {
    logger.error(`❌failed to fetch completed orders ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "failed to fetch completed orders", error);
  }
};

export const captainArrived = async (req, res) => {
  const { orderId } = req.params;
  const { mobile, userId } = req.user;
  logger.info(`ℹ️CAPTAIN ARRIVED api hit ${mobile}`);

  try {
    const updatedOrder = await OrderModal.findOneAndUpdate(
      { _id: orderId, acceptCaptain: userId },
      { $set: { isArrived: true } },
      { new: true }
    );

    // send event to real time service to notify user captain is arrived
    publishToRedis("order.captainIsarrived", {
      orderId: updatedOrder?._id,
    });

    return sendResponse(res, 200, "Captain arrived successfully", null, {
      order: updatedOrder,
    });
  } catch (error) {
    logger.error(`❌Captain Arrived Error: ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Captain Arrived Error:", error);
  }
};

export const getDayWiseEarning = async (req, res) => {
  const { mobile, userId } = req.user;
  const { date } = req.params;
  logger.info(`ℹ️CAPTAIN DAY WISE EARNINGS API hit by ${mobile} for ${date}`);

  try {
    const { source, data: dayWiseOrders } = await fetchDayWiseEarnings(
      userId,
      date,
      req.redisClient
    );
    logger.info(
      `✅ Day-wise earnings fetched from ${source} for ${userId} on ${date}`
    );
    return sendResponse(res, 200, `Fetched from ${source}`, null, {
      dayWiseOrders,
    });
  } catch (error) {
    logger.error(`❌failed to fetch day Earnings ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "failed to fetch day Earnings", error);
  }
};

export const todayEarnings = async (req, res) => {
  const { mobile, userId } = req.user;
  const { todayDate } = req.body;
  logger.info(`ℹ️ TODAY EARNINGS API hit by ${mobile} for ${todayDate}`);
  try {
    const order = await todayEarningsService(todayDate, userId);
    return sendResponse(res, 200, "Today's earnings fetched", null, { order });
  } catch (error) {
    logger.error(`❌ Failed to fetch today earnings for ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to fetch today's earnings", error);
  }
};

export const getHighDemandAreas = async (req, res) => {
  const { mobile } = req.user;
  logger.info(`ℹ️ HIGH DEMAND AREA api hit by ${mobile}`);
  try {
    const highDemandClusters = await getHighDemandAreasService();
    return sendResponse(res, 200, "", null, { highDemandClusters });
  } catch (error) {
    logger.error(`❌Failed to fetch high-demand areas ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to fetch high-demand areas", error);
  }
};
