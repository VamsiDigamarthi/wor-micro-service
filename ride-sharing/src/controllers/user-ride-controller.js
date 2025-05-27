import { sendResponse } from "../../../partner/src/utils/sendResponse.js";
import OrderModal from "../modals/ride-modal.js";
import logger from "../utils/logger.js";
import { validateRide } from "../utils/validation.js";
import {
  getCachedHomePlaces,
  removeCacheByKey,
  setCachedHomePlaces,
} from "../redis/redis.js";
import {
  cancelOrderService,
  changeDestinationPlaceService,
  changePaymentMethodService,
  createOrder,
  deleteOrderByUser,
  getAllFavoriteOrder,
  getAllOrders,
  getPendingOrders,
  middleDropAcceptService,
  removeTipService,
  rePlaceOrderSer,
  retryCaptainSearch,
  toggleFavoriteOrder,
} from "../service/user-ride-service.js";

export const placeOrder = async (req, res) => {
  logger.info("ℹ️ PLACE ORDER api hit");
  const { mobile, userId } = req.user;

  const rideData = {
    price: req.body?.price,
    head: userId,
    pickupAddress: req.body?.pickupAddress,
    pickupVicinity: req.body?.pickupVicinity,
    dropAddress: req.body?.dropAddress,
    dropVicinity: req.body?.dropVicinity,
    orderPlaceTime: req.body?.orderPlaceTime,
    orderPlaceDate: req.body?.orderPlaceDate,
    socketPlaceTime: req.body?.orderPlaceTime,
    vehicleType: req.body?.vehicleType,
    pickup: {
      type: "Point",
      coordinates: [
        parseFloat(req.body?.pickupLongitude),
        parseFloat(req.body?.pickupLangitude),
      ],
    },
    drop: {
      type: "Point",
      coordinates: [
        parseFloat(req.body?.dropLongitude),
        parseFloat(req.body?.dropLangitude),
      ],
    },
  };

  const { error } = validateRide(rideData);
  if (error) {
    const validationMsg = error.details[0]?.message;
    logger.warn("❌ Place Order Validation Error:", validationMsg);
    return sendResponse(res, 400, "Validation Error", validationMsg);
  }

  try {
    const order = await createOrder(rideData);
    logger.info(`ℹ️ New order Placed Successfully..! ${mobile}`);

    retryCaptainSearch({ order });

    await removeCacheByKey(req.redisClient, `all_orders:${userId}`);

    return sendResponse(res, 201, "Order placed successfully!", null, {
      order,
    });
  } catch (error) {
    logger.error(`❌ Failed to place the order : ${mobile} ${error}`);
    return sendResponse(res, 500, "Failed to place the order", error);
  }
};

export const pendingOrders = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ GET PENDING ALL RIDES api hit ${mobile}`);

  try {
    const orders = await getPendingOrders(userId);

    return sendResponse(res, 200, "", null, { orders });
  } catch (error) {
    logger.error(`❌ Failed to fetch pending orders: ${mobile} ${error}`);
    return sendResponse(res, 500, "Failed to fetch pending orders", error);
  }
};

export const fetchAllOrders = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ GET ALL RIDES api hit ${mobile}`);

  const redisKey = `all_orders:${userId}`;

  try {
    const cachedData = await getCachedHomePlaces(req.redisClient, redisKey);
    if (cachedData) {
      logger.info(`ℹ️ [GET ALL ORDERS] Cache hit for ${mobile}`);
      return sendResponse(res, 200, "all orders", null, { orders: cachedData });
    }

    const orders = await getAllOrders(userId);
    await setCachedHomePlaces(req.redisClient, redisKey, orders);

    return sendResponse(res, 200, "", null, { orders: orders ?? [] });
  } catch (error) {
    logger.error(`❌ Failed to fetch orders: ${mobile} ${error}`);
    return sendResponse(res, 500, "Failed to fetch orders", error);
  }
};

export const rideDeletRequest = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️RIDE DELETE REQUEST api hit ${mobile}`);
  const { orderId } = req.params;

  try {
    const result = await deleteOrderByUser(orderId, userId);
    if (!result) {
      logger.warn(`⚠️ RIDE DELETE FAILED: Order not found for ${mobile}`);
      return sendResponse(res, 404, "Order not found or unauthorized");
    }

    logger.info(`ℹ️RIDE DELETE REQUEST SUCCESSFULLY..! ${mobile}`);
    return sendResponse(res, 200, "order deleted");
  } catch (error) {
    logger.error(`❌ Ride Delet request failed ${mobile} ${error}`);
    return sendResponse(res, 500, "Ride Delet request failed", error);
  }
};

export const rePlaceOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️RE-PLACE ORDER  api hit ${mobile}`);
  const { orderId } = req.params;

  try {
    const order = await rePlaceOrderSer(orderId, userId, req.body);
    if (!order)
      return sendResponse(res, 404, "Order not found or not authorized");

    retryCaptainSearch({
      orderId: order._id,
      pickupLongitude: order.pickup.coordinates[1],
      pickupLatitude: order.pickup.coordinates[0],
    });

    logger.info(`ℹ️ Order ${orderId} reset for re-placement`);
    return sendResponse(res, 200, "Re-place ordered...!");
  } catch (error) {
    logger.error(`❌ re-place order error ${mobile} ${error}`);
    return sendResponse(res, 500, "re-place order error", error);
  }
};

export const addFavoriteOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️FAVORITE ORDER api hit ${mobile}`);
  const { orderId } = req.params;

  try {
    await toggleFavoriteOrder(orderId);
    await removeCacheByKey(req.redisClient, `all_favorite_orders:${userId}`);
    return sendResponse(res, 200, "Updated...!");
  } catch (error) {
    logger.error(`❌ Favorite Order Failed ${mobile} ${error}`);
    return sendResponse(res, 500, "Favorite Order Failed", error);
  }
};

export const fetchAllFaviouriteOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️GET FAVORITE ORDER api hit ${mobile}`);
  const redisKey = `all_favorite_orders:${userId}`;
  try {
    const cachedData = await getCachedHomePlaces(req.redisClient, redisKey);
    if (cachedData) {
      logger.info(`ℹ️ [GET ALL FAVORITE ORDERS] Cache hit for ${mobile}`);
      return sendResponse(res, 200, "all orders", null, {
        favoriteOrders: cachedData,
      });
    }

    const favOrders = await getAllFavoriteOrder(userId);

    await setCachedHomePlaces(req.redisClient, redisKey, favOrders);
    return sendResponse(res, 200, "", null, {
      favoriteOrders: favOrders ?? [],
    });
  } catch (error) {
    logger.error(`❌favorite Order fetching Faield ${mobile} ${error}`);
    return sendResponse(res, 500, "favorite Order fetching Faield", error);
  }
};

// in-completed
export const cancelOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  const { reason, afterAcceptCancelRide, userType } = req.body;

  logger.info(`ℹ️CANCEL ORDER api hit ${mobile}`);
  try {
    const order = await OrderModal.findById(orderId);
    if (!order) return sendResponse(res, 404, "Order not found");

    if (order.status === "cancelled")
      return sendResponse(res, 400, "Order is already cancelled");

    await cancelOrderService(orderId, userId, reason);

    logger.info(`ℹ️CANCEL ORDER SUCCESSFULLY ${mobile}`);
    return sendResponse(res, 200, "Order Canceled....!");
  } catch (error) {
    logger.error(`❌ Cancel Order Failed for ${mobile}: ${error}`);
    return sendResponse(res, 500, "Cancel Order Failed", error);
  }
};

// in-completed
export const changeDestinationPlace = async (req, res) => {
  const { mobile, userId } = req.user;
  const { place, orderId } = req.body;
  logger.info(`ℹ️CHANGE DESTINATION api hit ${mobile}`);
  try {
    const order = await OrderModal.findOne({ _id: orderId, head: userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedOrder = await changeDestinationPlaceService(
      userId,
      orderId,
      place,
      order.drop.coordinates
    );

    return sendResponse(
      res,
      200,
      "Destination location updated successfully",
      null,
      {
        order: updatedOrder,
      }
    );
  } catch (error) {
    logger.error(`❌ Change destination failed ${mobile}: ${error}`);
    return sendResponse(res, 500, "Change destination failed", error);
  }
};

export const fetchLastOrder = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️LATEST ORDER api hit ${mobile}`);
  try {
    const lastOrder = await OrderModal.findOne({
      head: userId,
    })
      .sort({ createdAt: -1 })
      .limit(1);
    return sendResponse(res, 200, "", null, { lastOrder: lastOrder ?? null });
  } catch (error) {
    logger.error(`❌failed to fetch last order ${mobile}: ${error}`);
    return sendResponse(res, 500, "failed to fetch last order", error);
  }
};

// in-completed
export const addedTip = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId, tip } = req.body;
  logger.info(`ℹ️TIP ADDED api hit ${mobile} ${orderId}`);

  try {
    const order = await OrderModal.findOneAndUpdate(
      { _id: orderId, head: userId },
      { $set: { addTip: tip } },
      { new: true }
    );
    return sendResponse(res, 200, "Tip Added Successfully..!");
  } catch (error) {
    logger.error(`❌tip added failed..! ${mobile}: ${error}`);
    return sendResponse(res, 500, "tip added failed..!", error);
  }
};

export const removeTip = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️TIP REMOVE api hit ${mobile} ${orderId}`);

  const result = await removeTipService(userId, orderId, mobile);

  return sendResponse(
    res,
    result?.status,
    result?.message,
    result?.error || null,
    { order: result?.updatedOrder || null }
  );
};

export const changePaymentMethod = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  const { paymentMethod } = req.body;
  logger.info(`ℹ️CHANGE PAYMENT METHOD api hit ${mobile} ${orderId}`);

  const result = await changePaymentMethodService(
    userId,
    orderId,
    paymentMethod,
    mobile
  );

  return sendResponse(
    res,
    result.status,
    result.message,
    result.error || null,
    { order: result.data?.order || null }
  );
};

export const middleDropRejection = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️MIDDLE DROP REJECTION api hit ${mobile} ${orderId}`);
  try {
    const existingOrder = await OrderModal.findById(orderId);

    await OrderModal.findOneAndUpdate(
      { _id: orderId, head: userId },
      { $set: { middleDrop: !existingOrder.middleDrop } },
      { new: true }
    );
    logger.info(`ℹ️MIDDLE DROP REJECTION SUCCESSFULLY ${mobile} ${orderId}`);
    return sendResponse(res, 200, "middle drop rejection added successfully");
  } catch (error) {
    logger.error(`❌ Middle Drop Rejection Failed ${mobile}: ${error}`);
    return sendResponse(res, 500, " Middle Drop Rejection Failed", error);
  }
};

export const confirmMiddleDrop = async (req, res) => {
  const { mobile, userId } = req.user;
  const { orderId } = req.params;
  logger.info(`ℹ️MIDDLE DROP ACCEPT api hit ${mobile} ${orderId}`);

  const result = await middleDropAcceptService(orderId, mobile);
  return sendResponse(res, result.status, result.message, result.error || null);
};
