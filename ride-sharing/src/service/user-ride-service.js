import logger from "../utils/logger.js";
import { getDistanceRange } from "../common-funs/general-fun.js";
import OrderModal from "../modals/ride-modal.js";
import { publishToRedis } from "../utils/redisPubSub.js";
import mongoose from "mongoose";
import { getFormattedDateTime } from "../common-funs/date-formate.js";
import OnDutyCaptain from "../modals/duty-change-users.js";
import {
  cancelOrderIfNeeded,
  fetchCaptains,
  logSearchRange,
  shouldStopRetrying,
  updateSocketPlaceTime,
} from "../common-funs/searchUtils.js";

export const createOrder = async (rideData) => {
  const order = new OrderModal(rideData);
  await order.save();
  return order;
};

export const retryCaptainSearch = ({ order }) => {
  let attempts = 0;
  const maxAttempts = 4;

  const sendCaptainSearch = async () => {
    const updatedOrder = await updateSocketPlaceTime(order._id);

    if (shouldStopRetrying(updatedOrder?.status)) {
      logger.info(
        `🛑 Order ${order?._id} status is '${updatedOrder.status}'. Stopping retry attempts.`
      );
      clearInterval(timer);
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(timer);
      await cancelOrderIfNeeded(updatedOrder, order._id);
      return;
    }

    const { minDistance, maxDistance } = getDistanceRange(attempts);
    logSearchRange(attempts, minDistance, maxDistance, order._id);

    try {
      const captains = await fetchCaptains();
      publishToRedis("ride.sharedToCaptain", { captains, order });
    } catch (error) {
      logger.error("❌ Failed to fetch captains:", error);
    }

    attempts++;
  };

  sendCaptainSearch();

  const timer = setInterval(sendCaptainSearch, 60000); // 1 min
};

export const getPendingOrders = async (userId) => {
  const orders = await OrderModal.aggregate([
    {
      $match: {
        status: { $nin: ["completed", "cancelled"] },
        head: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "head",
        foreignField: "_id",
        as: "head",
      },
    },
    { $unwind: "$head" },
    {
      $lookup: {
        from: "users",
        localField: "acceptCaptain",
        foreignField: "_id",
        as: "acceptCaptain",
      },
    },
    {
      $unwind: {
        path: "$acceptCaptain",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        status: 1,
        pickupAddress: 1,
        pickupVicinity: 1,
        dropAddress: 1,
        dropVicinity: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        price: 1,
        distanceFromPickUpToDrop: 1,
        distanceFromCaptainToPickUp: 1,
        head: {
          _id: "$head._id",
          name: "$head.name",
          email: "$head.email",
          mobile: "$head.mobile",
          profilePic: "$head.profilePic",
        },
        acceptCaptain: {
          _id: "$acceptCaptain._id",
          name: "$acceptCaptain.name",
          email: "$acceptCaptain.email",
          mobile: "$acceptCaptain.mobile",
          activeService: "$acceptCaptain.activeService",
          services: "$acceptCaptain.services",
          profilePic: "$acceptCaptain.profilePic",
          languages: "$acceptCaptain.languages",
        },
      },
    },
  ]);

  return orders;
};

export const getAllOrders = async (userId) => {
  const orders = await OrderModal.aggregate([
    {
      $match: {
        head: new mongoose.Types.ObjectId(userId),
        deletRequest: false,
      },
    },
    {
      $lookup: {
        from: "ratings",
        let: { orderId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$orderId", "$$orderId"] },
                  { $eq: ["$author", new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
        ],
        as: "ratings",
      },
    },
    {
      $addFields: {
        ratings: { $arrayElemAt: ["$ratings", 0] },
      },
    },
    {
      $project: {
        _id: 1,
        price: 1,
        extraCharge: 1,
        addTip: 1,
        paymentMethod: 1,
        vehicleType: 1,
        status: 1,
        receivedAmount: 1,
        attempts: 1,
        futureTime: 1,
        useScheduleActualTime: 1,
        cancelReason: 1,
        orderPlaceDate: 1,
        orderPlaceTime: 1,
        head: 1,
        deletRequest: 1,
        pickup: 1,
        pickupAddress: 1,
        pickupVicinity: 1,
        isSendOrReceiveParcel: 1,
        drop: 1,
        dropAddress: 1,
        dropVicinity: 1,
        acceptCaptain: 1,
        favorite: 1,
        saved: 1,
        rejectedCaptaine: 1,
        parcelType: 1,
        deliveryInstruction: 1,
        giveVehicleNumber: 1,
        time: 1,
        howManyMans: 1,
        mensProblem: 1,
        orderOtp: 1,
        orderOtpVerified: 1,
        isArrived: 1,
        captainCoor: 1,
        sendReceiverData: 1,
        isGivenReviewOrNotByUser: 1,
        isGivenReviewOrNotByCaptain: 1,
        ratings: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return orders;
};

export const deleteOrderByUser = async (orderId, userId) => {
  const result = await OrderModal.findOneAndUpdate(
    { _id: orderId, head: userId },
    { $set: { deletRequest: true } },
    { new: true }
  );
  return result;
};

export const rePlaceOrderSer = async (orderId, userId, body) => {
  return OrderModal.findOneAndUpdate(
    { _id: orderId, head: userId },
    {
      $set: {
        status: "pending",
        orderPlaceDate: body.orderPlaceDate,
        orderPlaceTime: body.orderPlaceTime,
        rejectedCaptaine: [],
      },
    },
    { new: true }
  );
};

export const toggleFavoriteOrder = async (orderId) => {
  const order = await OrderModal.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  order.favorite = !order.favorite;
  await order.save();

  return order;
};

export const getAllFavoriteOrder = async (userId) => {
  return await OrderModal.find({
    favorite: true,
    head: userId,
  });
};

export const cancelOrderService = async (orderId, userId, reason) => {
  await OrderModal.findOneAndUpdate(
    { _id: orderId },
    {
      $set: {
        cancelReason: {
          user: userId,
          reason: reason ?? "",
          // role: user.role,
        },
        status: "cancelled",
      },
    },
    { new: true }
  );
};

export const changeDestinationPlaceService = async (
  userId,
  orderId,
  place,
  dropCoordinate
) => {
  const newDropLocation = {
    type: "Point",
    coordinates: [place.location.lng, place.location.lat],
  };

  const newDropAddress = place.name;
  const newDropVicinity = place.vicinity;

  const pickupCoords = dropCoordinate;
  const dropCoords = newDropLocation.coordinates;

  // const price = calculateDistance(pickupCoords, dropCoords, order.vehicleType);
  const price = 10;
  await OrderModal.updateOne(
    { _id: orderId, head: userId },
    {
      $set: {
        newDropLocation,
        newDropAddress,
        newDropVicinity,
        changeDesPrice: price,
      },
    }
  );

  const updatedOrderAgg = await OrderModal.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
    {
      $lookup: {
        from: "users",
        localField: "acceptCaptain",
        foreignField: "_id",
        as: "acceptCaptain",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "head",
        foreignField: "_id",
        as: "head",
      },
    },
    { $unwind: "$acceptCaptain" },
    { $unwind: "$head" },
    {
      $project: {
        attempts: 0,
        createdAt: 0,
        __v: 0,
        favorite: 0,
        rejectedCaptaine: 0,
        saved: 0,
        sendReceiverData: 0,
        updatedAt: 0,
        userAuthenticationImage: 0,
      },
    },
  ]);

  if (!updatedOrderAgg.length) {
    const error = new Error("Order not found after update");
    error.status = 404;
    throw error;
  }

  return updatedOrderAgg[0];
};

export const changePaymentMethodService = async (
  userId,
  orderId,
  paymentMethod,
  mobile
) => {
  if (!paymentMethod) {
    return {
      status: 400,
      message: "Payment method is required!",
    };
  }

  try {
    await OrderModal.findOneAndUpdate(
      { _id: orderId, head: userId },
      { $set: { paymentMethod: paymentMethod } },
      {
        new: true,
      }
    );

    const updatedOrder = await OrderModal.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
          head: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "head",
          foreignField: "_id",
          as: "head",
        },
      },
      {
        $unwind: {
          path: "$head",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "acceptCaptain",
          foreignField: "_id",
          as: "acceptCaptain",
        },
      },
      {
        $unwind: {
          path: "$acceptCaptain",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          price: 1,
          extraCharge: 1,
          addTip: 1,
          paymentMethod: 1,
          status: 1,
          pickupAddress: 1,
          pickupVicinity: 1,
          dropAddress: 1,
          dropVicinity: 1,
          pickup: 1,
          drop: 1,
          deletRequest: 1,
          cancelReason: 1,
          newDropLocation: 1,
          newDropAddress: 1,
          newDropVicinity: 1,
          newDesitionOrderStatus: 1,
          changeDesPrice: 1,
          createdAt: 1,
          updatedAt: 1,

          // Only include desired nested fields
          "head.name": 1,
          "head.mobile": 1,
          "head.email": 1,
          "head.profilePic": 1,

          "acceptCaptain.name": 1,
          "acceptCaptain.email": 1,
          "acceptCaptain.mobile": 1,
          "acceptCaptain.rcCardDetails": 1,
          "acceptCaptain.activeService": 1,
          "acceptCaptain.services": 1,
          "acceptCaptain.profilePic": 1,
          "acceptCaptain.languages": 1,
        },
      },
    ]);

    return {
      status: 200,
      message: "Payment Method changed!",
      data: { order: updatedOrder },
    };
  } catch (error) {
    logger.error(`❌change payment method failed..! ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "Failed to change payment method",
      error,
    };
  }
};

export const removeTipService = async (userId, orderId, mobile) => {
  try {
    await OrderModal.findOneAndUpdate(
      { _id: orderId, head: userId },
      { $set: { addTip: 0 } },
      {
        new: true,
      }
    );

    const updatedOrder = await OrderModal.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
          head: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "head",
          foreignField: "_id",
          as: "head",
        },
      },
      {
        $unwind: {
          path: "$head",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "acceptCaptain",
          foreignField: "_id",
          as: "acceptCaptain",
        },
      },
      {
        $unwind: {
          path: "$acceptCaptain",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          price: 1,
          extraCharge: 1,
          addTip: 1,
          paymentMethod: 1,
          status: 1,
          pickupAddress: 1,
          pickupVicinity: 1,
          dropAddress: 1,
          dropVicinity: 1,
          pickup: 1,
          drop: 1,
          deletRequest: 1,
          cancelReason: 1,
          newDropLocation: 1,
          newDropAddress: 1,
          newDropVicinity: 1,
          newDesitionOrderStatus: 1,
          changeDesPrice: 1,
          createdAt: 1,
          updatedAt: 1,

          // Only include desired nested fields
          "head.name": 1,
          "head.mobile": 1,
          "head.email": 1,
          "head.profilePic": 1,

          "acceptCaptain.name": 1,
          "acceptCaptain.email": 1,
          "acceptCaptain.mobile": 1,
          "acceptCaptain.rcCardDetails": 1,
          "acceptCaptain.activeService": 1,
          "acceptCaptain.services": 1,
          "acceptCaptain.profilePic": 1,
          "acceptCaptain.languages": 1,
        },
      },
    ]);
    return {
      status: 200,
      message: "Remove tip successfully",
      updatedOrder,
    };
  } catch (error) {
    logger.error(`❌Failed to delete tip ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "Failed to delete tip",
      error,
    };
  }
};

export const middleDropAcceptService = async (orderId, mobile) => {
  try {
    const existingOrder = await OrderModal.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId),
        },
      },
      {
        $lookup: {
          from: "users", // Make sure this matches the actual MongoDB collection name
          localField: "acceptCaptain",
          foreignField: "_id",
          as: "acceptCaptain",
        },
      },
      {
        $unwind: {
          path: "$acceptCaptain",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "head",
          foreignField: "_id",
          as: "head",
        },
      },
      {
        $unwind: {
          path: "$head",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          // Include all OrderModel fields
          _id: 1,
          status: 1,
          paymentMethod: 1,
          // Add any other fields from the order model you need

          // Only selected fields from acceptCaptain
          "acceptCaptain.name": 1,
          "acceptCaptain.email": 1,
          "acceptCaptain.mobile": 1,
          "acceptCaptain.role": 1,

          // Only selected fields from head
          "head.name": 1,
          "head.mobile": 1,
          "head.role": 1,
        },
      },
    ]);
    return {
      status: 200,
      message: "Completed Order Updated successfully...!",
    };
  } catch (error) {
    logger.error(`❌Middle Drop Confirm Failed ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "Middle Drop Confirm Failed",
      error,
    };
  }
};
