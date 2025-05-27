import mongoose from "mongoose";
import OrderModal from "../modals/ride-modal.js";
import logger from "../utils/logger.js";
import { getPopulatedOrderById } from "../common-funs/get-populated-order.js";
import { getCachedHomePlaces, setCachedHomePlaces } from "../redis/redis.js";

export const getAllPendingOrderByDistance = async ({
  userId,
  lng,
  lat,
  distance,
  currentData,
  mobile,
}) => {
  try {
    let meters = parseInt(distance) * 1000;
    if (lng || lat) {
      const orders = await OrderModal.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            distanceField: "distance",
            maxDistance: meters,
            minDistance: 0,
            spherical: true,
            key: "pickup",
          },
        },
        {
          $match: {
            orderPlaceDate: currentData,
            status: { $in: ["pending", "escape", "waiting"] },
            rejectedCaptaine: { $nin: [new mongoose.Types.ObjectId(userId)] },
          },
        },
        {
          $lookup: {
            from: "users", // collection name
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
            distance: 1,
            pickup: 1,
            status: 1,
            orderPlaceDate: 1,
            // Include full order fields as needed...
            head: {
              name: "$head.name",
              mobile: "$head.mobile",
            },
          },
        },
      ]);

      return {
        status: 200,
        orders,
      };
    }
  } catch (error) {
    logger.error(`❌All pending fetch orders Faield ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "All pending fetch orders Faield",
      error,
    };
  }
};

export const checkActiveOrder = async (userId) => {
  return await OrderModal.findOne(
    { acceptCaptain: userId, status: "accept" },
    { _id: 1 } // Only check existence
  );
};

export const checkAlreadyOrderAcceptOrNot = async ({ orderId }) => {
  return await OrderModal.findOne(
    {
      _id: orderId,
    },
    { status: 1, pickup: 1 }
  );
};

export const updateAndFetchPopulatedOrder = async ({
  orderId,
  userId,
  mobile,
  location,
  distanceFromCaptainToPickUp,
}) => {
  await OrderModal.findOneAndUpdate(
    { _id: orderId },
    {
      $set: {
        status: "accept",
        acceptCaptain: userId,
        captainCoor: [parseFloat(location?.lng), parseFloat(location?.lat)],
        distanceFromCaptainToPickUp: Number(distanceFromCaptainToPickUp),
        captainMobile: mobile,
      },
    }
  );

  return await getPopulatedOrderById(orderId);
};

export const fetchAcceptOrdersService = async (userId) => {
  const activeOrder = await OrderModal.aggregate([
    {
      $match: {
        status: { $nin: ["pending", "cancelled"] },
        acceptCaptain: new mongoose.Types.ObjectId(userId),
        paymentStatus: { $in: ["pending", "failed"] },
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
        "head.name": 1,
        "head.mobile": 1,
        "head.profilePic": 1,
        "head.vehicleNumber": 1,
        "head.vehicleFrontImage": 1,
        // include all other fields of order
        price: 1,
        extraCharge: 1,
        addTip: 1,
        paymentMethod: 1,
        status: 1,
        acceptCaptain: 1,
        captainMobile: 1,
        pickupAddress: 1,
        pickupVicinity: 1,
        dropAddress: 1,
        dropVicinity: 1,
        pickup: 1,
        drop: 1,
        deletRequest: 1,
        favorite: 1,
        cancelReason: 1,
        newDropLocation: 1,
        newDesitionOrderStatus: 1,
        changeDesPrice: 1,
        middleDrop: 1,
        orderPlaceDate: 1,
        orderPlaceTime: 1,
        socketPlaceTime: 1,
        rejectedCaptaine: 1,
        vehicleType: 1,
        paymentStatus: 1,
        captainCoor: 1,
        distanceFromCaptainToPickUp: 1,
        createdAt: 1,
      },
    },
    {
      $limit: 1, // To mimic `findOne`
    },
  ]);

  return activeOrder;
};

export const acceptOrderChangeDestinationServer = async ({
  orderId,
  status,
}) => {
  await OrderModal.findByIdAndUpdate(
    orderId,
    { $set: { newDesitionOrderStatus: status } },
    {
      new: true,
    }
  );
  return await getPopulatedOrderById(orderId);
};

export const orderVerifiedOtpService = async ({
  isbeforeReachPickupEnterOtp,
  extraCharge,
  orderId,
}) => {
  await OrderModal.findByIdAndUpdate(
    orderId,
    {
      $set: {
        orderOtpVerified: true,
        isArrived: isbeforeReachPickupEnterOtp,
        extraCharge: extraCharge || 0,
      },
    },
    {
      new: true,
    }
  );

  return await getPopulatedOrderById(orderId);
};

export const orderCompletedService = async ({ orderId }) => {
  await OrderModal.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status: "completed",
      },
    },
    {
      new: true,
    }
  );
  return await getPopulatedOrderById(orderId);
};

export const fetchDayWiseEarnings = async (userId, date, redisClient) => {
  // const cacheKey = `day_wise_earnings:${userId}:${date}`;

  // // Try to get data from cache
  // const cachedData = await getCachedHomePlaces(redisClient, cacheKey);
  // if (cachedData) {
  //   return { source: "cache", data: cachedData };
  // }

  // Fallback to DB query
  const dayWiseOrders = await OrderModal.find({
    orderPlaceDate: date,
    acceptCaptain: userId,
  });

  // // Store fresh data in cache
  // await setCachedHomePlaces(redisClient, cacheKey, dayWiseOrders);

  return { source: "db", data: dayWiseOrders };
};

export const todayEarningsService = async (date, userId) => {
  return await OrderModal.find(
    {
      orderPlaceDate: date,
      acceptCaptain: userId,
      status: "completed",
    },
    {
      price: 1,
      status: 1,
      worCommission: 1,
      captainEarningAfterCutting: 1,
    }
  )
    .sort({ createdAt: -1 })
    .lean();
};

export const getHighDemandAreasService = async () => {
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  return await OrderModal.aggregate([
    {
      $match: {
        createdAt: { $gte: fourDaysAgo },
        "pickup.coordinates": { $exists: true, $ne: [] },
      },
    },
    {
      $project: {
        roundedLat: {
          $round: [{ $arrayElemAt: ["$pickup.coordinates", 1] }, 4],
        },
        roundedLng: {
          $round: [{ $arrayElemAt: ["$pickup.coordinates", 0] }, 4],
        },
        pickupAddress: 1,
        pickupVicinity: 1,
      },
    },
    {
      $group: {
        _id: {
          coordinates: ["$roundedLng", "$roundedLat"],
        },
        count: { $sum: 1 },
        pickupAddress: { $first: "$pickupAddress" },
        pickupVicinity: { $first: "$pickupVicinity" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);
};
