import axios from "axios";
import OtpModel from "../modals/otpModal.js";
import logger from "../utils/logger.js";
import { generateOtp } from "../utils/generate-otp.js";
import jwt from "jsonwebtoken";
import UserModel from "../modals/UserModal.js";
import { validateRegisterData } from "../utils/validation.js";
import { generateReferralCode } from "../utils/generate-referal-code.js";
import AdminUsersModel from "../modals/AdminUserModal.js";
import { publishEvent } from "../utils/rabbitmq.js";

async function saveOrUpdateOtp(existingOtp, mobile, otp) {
  if (existingOtp) {
    existingOtp.otp = otp;
    await existingOtp.save();
  } else {
    const newOtp = new OtpModel({ mobile, otp });
    await newOtp.save();
  }
}

export const sendOtpService = async (mobile) => {
  if (!mobile) {
    const msg = "Mobile number is required";
    logger.warn(msg);
    return { status: 400, message: msg };
  }

  try {
    const existingOtp = await OtpModel.findOne({ mobile });
    const otp = generateOtp();

    const otpApiUrl = `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/+91${mobile}/${otp}/OTP TEMPLATE`;

    await axios.get(otpApiUrl);
    await saveOrUpdateOtp(existingOtp, mobile, otp);

    logger.info(`OTP sent successfully to ${mobile}`);
    return { status: 200, message: "OTP sent successfully!" };
  } catch (error) {
    logger.error(`Failed to send OTP to ${mobile}: ${error.message}`, {
      stack: error.stack,
    });
    return {
      status: 500,
      message: "Failed to send OTP",
      error,
    };
  }
};

export const verifyOtpService = async ({
  mobile,
  otp,
  deviceId,
  isUserApp = false,
  userType,
}) => {
  if (!mobile) return { status: 400, message: "Mobile number is required." };
  if (!otp) return { status: 400, message: "OTP is required." };

  try {
    const existingOtpEntry = await OtpModel.findOne({ mobile });
    if (!existingOtpEntry)
      return { status: 401, message: "OTP not found for this number." };

    if (existingOtpEntry.otp?.toString() !== otp?.toString()) {
      logger.warn(`Invalid OTP attempt for ${mobile}`);
      return { status: 401, message: "Invalid OTP" };
    }

    const user = await UserModel.findOneAndUpdate(
      { mobile },
      { $set: { role: userType } },
      { new: true }
    );

    if (!user) {
      logger.warn(`User does not exist: ${mobile}`);
      return { status: 404, message: "User does not exist", data: { mobile } };
    }

    const services = user?.services;

    if (user.role === "captain" && !user.userVerified && isUserApp) {
      return {
        status: 403,
        message: "User profile is still in progress.",
        data: { mobile: user.mobile, services },
      };
    }

    if (user.deviceId !== deviceId) {
      user.deviceId = deviceId;
    }

    if (user.accountDeleteStatus === "pending") {
      user.accountDeleteStatus = "active";
      user.accountDeleteRequestDate = null;
    }

    await user.save();

    const payload = { mobile: user.mobile, id: user._id };
    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

    logger.info(`OTP verification successful for ${mobile}`);
    return {
      status: 200,
      message: "OTP verified successfully.",
      data: { token },
    };
  } catch (error) {
    logger.error(`Failed to verify OTP for ${mobile}: ${error.message}`);
    return {
      status: 500,
      message: "Failed to verify OTP",
      error: error.message,
    };
  }
};

export const registerUserService = async (userData) => {
  const {
    name,
    email,
    mobile,
    deviceId,
    role,
    languages,
    referalCode,
    manuallyRegister,
  } = userData;

  const { error } = validateRegisterData(userData);
  if (error) {
    logger.warn("Register Validation error", error.details[0]?.message);
    return {
      status: 400,
      message: "Register Validation error",
      error: error.details[0]?.message,
    };
  }

  const existingUser = await UserModel.findOne({ mobile });
  if (existingUser) {
    return {
      status: 400,
      message: "User Already Exists...!",
      data: { user: existingUser },
    };
  }

  const user = new UserModel({
    name,
    email,
    mobile,
    role,
    languages,
    deviceId,
    captainLocation: {
      type: "Point",
      coordinates: [76.978987, 17.8765678], // Default location
    },
    referalCode,
    manuallyRegister,
  });

  await user.save();

  // Generate unique referral code after saving the user
  user.ownRefCode = generateReferralCode(user._id);
  await user.save();

  const payload = { mobile, id: user._id };
  const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

  const supportUser = await AdminUsersModel.findOne({
    whichType: user.role,
    role: "support",
  });

  // Event to notify support system
  // await publishEvent("support.chatcreate", {
  //   userId: user._id.toString(),
  //   adminUserId: supportUser?._id?.toString(),
  // });

  logger.info("User Register Successfully..!", mobile);
  return {
    status: 201,
    message: "User Register Successfully..!",
    data: { token },
  };
};

export const removeOtpService = async (mobile) => {
  if (!mobile) {
    return {
      status: 400,
      message: "Please send mobile number..!",
    };
  }

  try {
    await OtpModel.findOneAndUpdate({ mobile }, { $set: { otp: 0 } });
    logger.info(`OTP expired successfully for ${mobile}`);
    return {
      status: 200,
      message: "OTP deleted Successfully",
    };
  } catch (error) {
    logger.error(`❌ Expire OTP Failed - ${mobile}: ${error}`);
    return {
      status: 500,
      message: "Expire OTP Failed",
      error,
    };
  }
};

// -------------------------

export const setMPinService = async (userId, mobile, mpin) => {
  if (!mpin) {
    return {
      status: 400,
      message: "MPIN is required!",
    };
  }

  try {
    await UserModel.findByIdAndUpdate(
      userId,
      { $set: { mpin } },
      { new: true }
    );

    logger.info(`✅ MPIN set successfully for ${mobile}`);
    return {
      status: 200,
      message: "MPIN set successfully",
    };
  } catch (error) {
    logger.error(`❌ Set MPIN failed for ${mobile}`, error);
    return {
      status: 500,
      message: "Set MPIN failed",
      error,
    };
  }
};

export const checkMPinService = async (userId, mobile, mpin) => {
  if (!mpin) {
    return {
      status: 400,
      message: "MPIN is required!",
    };
  }

  try {
    const userFromDb = await UserModel.findById(userId);

    if (userFromDb.mpin === mpin)
      return {
        status: 200,
        message: "MPIN matched",
      };

    return {
      status: 400,
      message: "Invalid MPIN",
    };
  } catch (error) {
    logger.error(`❌Check MPIN failed ${mobile}`, error);
    return {
      status: 500,
      message: "Check MPIN failed",
      error,
    };
  }
};

export const changeDuttyService = async ({
  latitude,
  longitude,
  mpin,
  mobile,
  userId,
  duttyStatus,
  userMpin,
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
          latitude,
          longitude,
        },
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

export const updateCaptainCoordinatesService = async ({
  userId,
  mobile,
  lat,
  lng,
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
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
        },
      },
      { new: true }
    );

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

export const updateRcDetailsService = async (userId, rcNumber, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const service = user.services.find((s) => s.rcNumber === rcNumber);
  if (!service) throw new Error("Service not found");

  const {
    fit_up_to,
    registration_date,
    owner_name,
    father_name,
    present_address,
    permanent_address,
    maker_description,
    maker_model,
    fuel_type,
    color,
    registered_at,
  } = data;

  service.fitUpTo = fit_up_to || service.fitUpTo;
  service.registrationDate = registration_date || service.registrationDate;
  service.ownerName = owner_name || service.ownerName;
  service.fatherName = father_name || service.fatherName;
  service.presentAddress = present_address || service.presentAddress;
  service.permanentAddress = permanent_address || service.permanentAddress;
  service.makerDescription = maker_description || service.makerDescription;
  service.makerModel = maker_model || service.makerModel;
  service.fuelType = fuel_type || service.fuelType;
  service.color = color || service.color;
  service.registeredAt = registered_at || service.registeredAt;

  await user.save();
  return service;
};

export const updateLicenseDetailsService = async (userId, data) => {
  const {
    license_number,
    state,
    name,
    permanent_address,
    temporary_address,
    dob,
    gender,
    profile_image,
  } = data;

  const licenseCardDetails = {
    licenseNumber: license_number,
    state,
    name,
    permanentAddress: permanent_address,
    temporaryAddress: temporary_address,
    dob,
    gender,
    profileImage: profile_image,
  };

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { licenseCardDetails } },
    { new: true }
  );

  return updatedUser;
};
