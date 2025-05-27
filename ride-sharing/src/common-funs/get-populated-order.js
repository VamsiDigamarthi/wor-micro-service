import mongoose from "mongoose";
import OrderModal from "../modals/ride-modal.js";

export const getPopulatedOrderById = async (orderId) => {
  const order = await OrderModal.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(orderId) },
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
        mobile: 1,
        captainMobile: 1,
        pickupAddress: 1,
        pickupVicinity: 1,
        dropAddress: 1,
        dropVicinity: 1,
        pickup: 1,
        drop: 1,
        newDropLocation: 1,
        newDropAddress: 1,
        newDropVicinity: 1,
        newDesitionOrderStatus: 1,
        changeDesPrice: 1,
        middleDrop: 1,
        orderPlaceDate: 1,
        orderPlaceTime: 1,
        socketPlaceTime: 1,
        vehicleType: 1,
        paymentStatus: 1,
        captainCoor: 1,
        distanceFromCaptainToPickUp: 1,
        acceptCaptain: {
          name: "$acceptCaptain.name",
          email: "$acceptCaptain.email",
          mobile: "$acceptCaptain.mobile",
          languages: "$acceptCaptain.languages",
          services: {
            $map: {
              input: "$acceptCaptain.services",
              as: "service",
              in: {
                serviceType: "$$service.serviceType",
                rcNumber: "$$service.rcNumber",
              },
            },
          },
        },
        head: {
          name: "$head.name",
          mobile: "$head.mobile",
          email: "$head.email",
          profilePic: "$head.profilePic",
        },
      },
    },
    {
      $limit: 1,
    },
  ]);

  return order?.[0] || null;
};
