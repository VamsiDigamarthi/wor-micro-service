import UserModel from "../modals/UserModal.js";
import WithdraRequestModel from "../modals/WithdrawRequestModal.js";
import { publishEvent } from "../rabbitmq/rabbitmq.js";
import logger from "../utils/logger.js";
export const handleWithdrawRequestService = async (body, user) => {
  const {
    paymnetBank,
    holderName,
    bankName,
    accountNumber,
    ifscCode,
    upiId,
    money,
  } = body;

  // Create a new withdrawal transaction
  const newTransaction = new WithdraRequestModel({
    user: user._id,
    paymnetBank,
    holderName,
    bankName,
    accountNumber,
    ifscCode,
    upiId,
    money,
  });

  await newTransaction.save();

  // Update user's wallet balance
  user.walletBalance -= +money;
  await user.save();

  return user;
};

export const getWithdrawRequestService = async ({ page, limit, fromDate }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const from = new Date(fromDate);
  const to = new Date(fromDate);
  to.setHours(23, 59, 59, 999);

  const dateFilter = {
    createdAt: {
      $gte: from,
      $lte: to,
    },
  };

  const [withdrawData, totalWithdrawRequestToday, approvedRequest] =
    await Promise.all([
      WithdraRequestModel.find({ ...dateFilter, isPayed: false })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WithdraRequestModel.countDocuments(dateFilter),
      WithdraRequestModel.countDocuments({ ...dateFilter, isPayed: true }),
    ]);

  return {
    withdrawData,
    totalPages: Math.ceil(totalWithdrawRequestToday / limit),
    currentPage: parseInt(page),
    totalWithdrawRequestToday,
    approvedRequest,
  };
};

export const withdrawRequestPayService = async (id) => {
  return await WithdraRequestModel.findByIdAndUpdate(
    id,
    { $set: { isPayed: true } },
    { new: true }
  );
};

// change dutty
export const changeDuttyService = async ({
  latitude,
  longitude,
  mpin,
  mobile,
  userId,
  duttyStatus,
  userMpin,
  activeService,
}) => {
  try {
    if (latitude && longitude && mpin) {
      if (parseInt(mpin) !== parseInt(userMpin)) {
        return {
          status: 400,
          message: "Incorrect MPIN",
        };
      }
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            onDuty: !duttyStatus,
            captainLocation: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)], // Store longitude and latitude in [longitude, latitude] format
            },
          },
        },
        { new: true }
      );

      // publish event to ride service to store on-duty captains
      await publishEvent("captain.onDuty", {
        captainId: userId,
        mobile: mobile,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        activeService,
      });

      return {
        status: 200,
        message: "Updated...!",
      };
    } else {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            onDuty: !duttyStatus,
          },
        },
        { new: true }
      );

      // remove the active captains list in ride service
      await publishEvent("captain.offDuty", {
        captainId: userId,
        mobile: mobile,
      });

      // send event to driver service to remove home place active service
      await publishEvent("homeplace.changeActive", { userId });

      // publish to driver service to change home places
      return {
        status: 200,
        message: "Updated...!",
      };
    }
  } catch (error) {
    logger.error(`❌Failed to change dutty ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "Failed to change dutty",
      error,
    };
  }
};

// update coordinates
export const updateCaptainCoordinatesService = async ({
  userId,
  mobile,
  latitude,
  longitude,
}) => {
  try {
    logger.info(`ℹ️ CAPTAIN UPDATED COORDINATE service hit ${mobile}`);

    if (mobile === "9502953130") {
      return {
        status: 200,
        message: "Updated...!",
      };
    }

    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          captainLocation: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
        },
      },
      { new: true }
    );

    // update each captain coordinate to ride service
    await publishEvent("captain.locationUpdate", {
      captainId: userId,
      mobile: mobile,
      location: {
        latitude,
        longitude,
      },
    });

    return {
      status: 200,
      message: "Updated...!",
    };
  } catch (error) {
    logger.error(
      `❌captain live coordinates update failed ${mobile}: ${error}`,
      {
        stack: error.stack,
      }
    );
    return {
      status: 500,
      message: "Captain live coordinates update failed",
      error,
    };
  }
};
