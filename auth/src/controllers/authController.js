import logger from "../utils/logger.js";
import { sendResponse } from "../utils/send-error.js";
import UserModel from "../modals/UserModal.js";
import jwt from "jsonwebtoken";
import { getUserAverageRating } from "../comman-apis/common-apis.js";
import { s3, uploadToS3 } from "../media/digitalOcena.js";
import {
  changeDuttyService,
  checkMPinService,
  registerUserService,
  removeOtpService,
  sendOtpService,
  setMPinService,
  updateCaptainCoordinatesService,
  updateLicenseDetailsService,
  updateRcDetailsService,
  verifyOtpService,
} from "../service/auth-service.js";
import {
  getCachedHomePlaces,
  removeCacheByKey,
  setCachedHomePlaces,
} from "../redis/redisCache.js";

export const sendOtp = async (req, res) => {
  logger.info("Send OTP endpoint hit");
  const { mobile } = req.body;
  const result = await sendOtpService(mobile);
  return sendResponse(res, result.status, result.message, result.error || null);
};

// verified OTP
export const verifyOtp = async (req, res) => {
  logger.info("VERIFY OTP endpoint hit...");
  const { mobile, otp, deviceId, isUserApp, userType } = req.body;

  const result = await verifyOtpService({
    mobile,
    otp,
    deviceId,
    isUserApp,
    userType,
  });

  return sendResponse(
    res,
    result.status,
    result.message,
    result.error || null,
    result.data
  );
};

// register apis
export const register = async (req, res) => {
  logger.info("Register endpoint hit");
  const result = await registerUserService(req.body);
  return sendResponse(
    res,
    result.status,
    result.message,
    result.error || null,
    result.data
  );
};

export const onRemoveOtp = async (req, res) => {
  logger.info("Send OTP expire API hit");
  const { mobile } = req.body;

  const result = await removeOtpService(mobile);
  return sendResponse(res, result.status, result.message, result.error || null);
};

export const checkDeviceId = async (req, res) => {
  logger.info("Check Device Id api hit");
  const { user } = req;
  const { deviceId } = req.body || {};
  try {
    if (user.deviceId !== deviceId) {
      logger.warn(`device id not matched ${user?.name}-${user.mobile}`);
      return res.status(400).json({ message: "device id not matched" });
    }
    logger.info(`DEVICE ID MATCHED ${user?.name}-${user.mobile}`);
    return res.status(200).json({ message: "device id Matched..!" });
  } catch (error) {
    logger.error(
      `checing device id failed ${user?.name}-${user.mobile} : ${error}`
    );
    return res
      .status(500)
      .json({ message: "checing device id failed", error: error.message });
  }
};

export const fetchProfile = async (req, res) => {
  const { user } = req;
  logger.info(`➡️ Profile API called by ${user?.mobile}`);

  try {
    const isCaptainWithLowBalance =
      user?.walletBalance < -500 && user.role === "captain";
    if (isCaptainWithLowBalance) {
      logger.warn(
        `⚠️ Captain (${user.mobile}) has low balance. Auto off-duty triggered.`
      );
      user.onDuty = false;
      await user.save();
    }

    const averageRating = await getUserAverageRating(user._id);
    const userData = user?._doc ? { ...user._doc, averageRating } : user;

    logger.info(`✅ Profile fetched for ${user.mobile}`);
    return sendResponse(res, 200, "Fetching Profile", null, { userData });
  } catch (error) {
    logger.error(`❌ Failed to fetch profile for ${user?.mobile}: ${error}`);
    return sendResponse(res, 500, "Failed to fetch profile.", error);
  }
};

export const deletionRequest = async (req, res) => {
  const { user } = req;
  const { selectedValue } = req.body || {};

  logger.info(`➡️ Account deletion request initiated by${user?.mobile}`);

  try {
    // Set deletion metadata on user profile
    user.deletionReason = selectedValue;
    user.accountDeleteStatus = "pending";
    user.accountDeleteRequestDate = new Date();

    await user.save();
    logger.info(`📝 Deletion request recorded for ${user.mobile}`);
    return sendResponse(
      res,
      200,
      "Your account deletion request has been submitted. It will be processed within 30 days."
    );
  } catch (error) {
    logger.error(
      `❌ Account deletion request failed for- ${user?.mobile}: ${error}`
    );
    sendResponse(res, 500, "Failed to submit account deletion request.", error);
  }
};

export const editProfile = async (req, res) => {
  const { user } = req;
  if (!req.file) return sendResponse(res, 400, "No profile picture uploaded");
  logger.info(`ℹ️ Edit profile api hit ${user.name}`);
  try {
    // const params = {
    //   Bucket: process.env.DO_SPACES_NAME,
    //   Key: `profile-pics/${Date.now()}_${req.file.originalname}`,
    //   Body: req.file.buffer,
    //   ACL: "public-read",
    //   ContentType: req.file.mimetype,
    // };

    // const uploadResult = await s3.upload(params).promise();
    const s3Url = await uploadToS3(req.file, "vehicle-images");

    await UserModel.findByIdAndUpdate(
      user._id,
      {
        profilePic: s3Url,
      },
      { new: true }
    );

    logger.info(
      `Profile pic uploaded successfully - ${user.mobile}`,
      uploadResult.Location
    );
    return sendResponse(res, 200, "Profile updated successfully", null, {
      profilePic: uploadResult.Location,
    });
  } catch (error) {
    logger.error(`❌ Error updating profile: - ${user.mobile}`, error);
    return sendResponse(res, 500, "Failed to edit profile", error);
  }
};

export const editProfileData = async (req, res) => {
  const { user } = req;
  logger.info(`➡️ Edit Profile Data API called by  ${user?.mobile}`);
  const { name, email, dateOfBirth, address, languages } = req.body || {};
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
  if (address) updateData.address = address;
  if (languages) updateData.languages = languages;

  try {
    await UserModel.findByIdAndUpdate(
      { _id: user._id },
      { $set: updateData },
      { new: true }
    );

    logger.info(`✔️ Profile Date edit successfully - ${user.mobile}`);
    return sendResponse(res, 200, "Profile Updated successfully...!");
  } catch (error) {
    logger.error(
      `❌ Failed to Edit Profile Data  for - ${user?.mobile}: ${error}`
    );
    return sendResponse(res, 500, "Failed to Edit Profile Data .", error);
  }
};

export const onAadharCardVerification = async (req, res) => {
  const { mobile, aadharNumber } = req.params;
  const aadharData = req.body?.data || {};
  const address = aadharData.address || {};

  logger.info(`ℹ️ Aadhar card verification API called by ${mobile}`);

  try {
    const user = await UserModel.findOne({ mobile });
    if (!user) return sendResponse(res, 404, "User not found");

    // Check for duplicate Aadhaar number in other users
    const existingUser = await UserModel.findOne({
      "docsNumber.newAadharNumber": aadharData.aadhaar_number,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      logger.warn(`⚠️ Aadhaar number already exists for another user`);
      return sendResponse(res, 400, "Aadhaar number already exists");
    }

    // Construct update payload
    const updateFields = {
      aadharCardDetails: {
        fullName: aadharData.full_name,
        dob: aadharData.dob,
        gender: aadharData.gender,
        careOf: aadharData.care_of,
        aadharImage: aadharData.profile_image,
        aadhaarNumber: aadharData.aadhaar_number,
        address: {
          country: address.country,
          dist: address.dist,
          state: address.state,
          village: address.vtc,
          mandal: address.loc,
          house: address.house,
        },
      },
    };

    if (user.role === "user" && aadharData.gender === "M") {
      updateFields.aadharCarVerificaation = true;
    } else {
      updateFields["docsNumber.newAadharNumber"] = aadharNumber;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: updateFields },
      { new: true }
    );

    return sendResponse(res, 200, "Aadhar details updated successfully", null, {
      updatedUser,
    });
  } catch (error) {
    logger.error(
      `❌ Aadhar card verification failed - ${user.mobile}, ${error}`
    );
    return sendResponse(res, 500, "Failed to upload Aadhar details.", error);
  }
};

export const updateFirebaseToken = async (req, res) => {
  const { user } = req;
  const { fbtoken, fbinstallationId } = req.body || {};
  logger.info(`➡️ Firebase token update api hit ${user.mobile}`);
  if (!fbtoken) return sendResponse(res, 400, "Firebase token is required");
  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { fbtoken: fbtoken, fbinstallationId: fbinstallationId },
      },
      { new: true }
    );

    logger.info(`➡️ Firebase token update Successfully ${user.mobile}`);
    return sendResponse(res, 200, "token updated successfully...!");
  } catch (error) {
    logger.error(`❌ update fb-token failed..! - ${user.mobile}, ${error}`);
    return sendResponse(res, 500, "update token failed..!", error);
  }
};

export const addedNewService = async (req, res) => {
  const { mobile, serviceType } = req.body || {};
  logger.info(`ℹ️ new service api hit ${mobile}`);
  try {
    const user = await UserModel.findOne({ mobile });
    if (!user) return sendResponse(res, 404, "User not found");
    const service = user.services.find((s) => s.serviceType === serviceType);
    if (service)
      return sendResponse(res, 400, "This service type already exists");

    if (user.services.length > 0) user.services.pop();

    user.services.push({ serviceType });
    await user.save();
    logger.info(`✔️ new service added  ${mobile}`);
    return sendResponse(res, 200, "Service updated successfully", null, {
      user,
    });
  } catch (error) {
    logger.error(`❌Failed to update service- ${mobile}`, error);
    return sendResponse(res, 500, "Failed to update service", error);
  }
};

export const rcNumberUpdate = async (req, res) => {
  const { serviceType, rcNumber } = req.body || {};
  const { mobile } = req.params;
  logger.info(`ℹ️ new service rc-number added api hit ${mobile}`);
  try {
    const user = await UserModel.findOne({ mobile });
    if (!user) return sendResponse(res, 404, "User not found");

    const service = user.services.find((s) => s.serviceType === serviceType);
    if (!service)
      return sendResponse(res, 400, "This service type already exists");

    service.rcNumber = rcNumber;
    await user.save();
    logger.info(`✔️ RC number updated successfully ${mobile}`);
    return sendResponse(res, 200, "RC number updated successfully", null, {
      rcNumber,
    });
  } catch (error) {
    logger.error(`❌Failed to update service rc number- ${mobile}`, error);
    return sendResponse(res, 500, "rc number update failed", error);
  }
};

export const addedNewServices = async (req, res) => {
  const { user } = req;
  const { serviceType, rcNumber, rejectType } = req.body || {};
  logger.info(`ℹ️ new service added api hit ${user?.mobile}`);
  try {
    const service = user.services.find((s) => s.serviceType === serviceType);
    if (service) {
      if (rejectType === "reUpload") {
        service.rcNumber = rcNumber;
        await user.save();
        logger.info(
          `✅RC number re-uploaded for existing service${user.mobile}`
        );
        return sendResponse(res, 200, "Service rcNumber updated successfully");
      }
      logger.warn(`⚠️ Attempt to add duplicate serviceType ${user.mobile}`);
      return sendResponse(res, 400, "This serviceType already exists");
    }
    user.services.push({ serviceType, rcNumber });
    await user.save();
    logger.info(`✅ New service added successfully - Mobile: ${user.mobile}`);

    return sendResponse(res, 200, "Service updated successfully");
  } catch (error) {
    logger.error(`❌Failed to update new service- ${user.mobile}`, error);
    return sendResponse(res, 500, "rc number update failed", error);
  }
};

export const vehicleImageUpload = async (req, res) => {};

export const changeMPin = async (req, res) => {
  const { user } = req;
  const { mpin } = req.body || {};
  logger.info(`ℹ️ Change M-Pin api hit ${user?.mobile}`);
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { mpin: mpin },
      },
      { new: true }
    );
    if (!updatedUser) return sendResponse(res, 400, "User not found");

    logger.info(`✅ MPIN changed successfully ${user?.mobile}`);
    return sendResponse(res, 200, "MPIN changed successfully", null, {
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`❌Failed to change m-pin- ${user.mobile}`, error);
    return sendResponse(res, 500, "Failed to Update M-Pin", error);
  }
};

export const setRoleInCaptainAuthCheck = async (req, res) => {
  const { mobile } = req.params;
  logger.info(`ℹ️Change role in auth check screen api hit ${mobile}`);
  if (!mobile) return sendResponse(res, 400, "Mobile number is required.");

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { mobile },
      { $set: { role: "captain" } },
      { new: true }
    );

    if (!updatedUser) return sendResponse(res, 404, "User not found.");

    const token = jwt.sign({ mobile }, process.env.JWT_TOKEN_SECRET);
    return sendResponse(res, 200, "", null, { user: updatedUser, token });
  } catch (error) {
    logger.error(`❌Failed get profile- ${mobile}`, error);
    return sendResponse(res, 500, "Failed get profile", error);
  }
};

export const storeDocsData = async (req, res) => {
  const { newAadharNumber, newPanNumber, newRcNumber, newLicenNumber, dob } =
    req.body;
  const { mobile } = req.params;
  logger.info(`ℹ️Captain Docs number added like dl api hit ${mobile}`);

  try {
    const user = await UserModel.findOne({ mobile: mobile });
    if (!user) return sendResponse(res, 404, "User not found");

    const updatedDocsNumber = {
      ...user.docsNumber, // Existing data
      ...(newAadharNumber && { newAadharNumber }),
      ...(newPanNumber && { newPanNumber }),
      ...(newRcNumber && { newRcNumber }),
      ...(newLicenNumber && { newLicenNumber }),
      ...(dob && { dob }),
    };

    await UserModel.findOneAndUpdate(
      { mobile: mobile },
      { $set: { docsNumber: updatedDocsNumber } }
    );
    logger.info(`ℹ️Captain Docs number added successfully like dl ${mobile}`);
    return sendResponse(res, 200, "Docs number updated successfully!");
  } catch (error) {
    logger.error(`❌Docs number update failed- ${mobile}`, error);
    return sendResponse(res, 500, "Docs number update failed", error);
  }
};

export const deletAccount = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️DELETE ACCOUNT api hit ${user.mobile}`);
  try {
    await UserModel.findOneAndDelete({ mobile: user?.mobile });
    logger.info(`ℹ️DELETE ACCOUNT SUCCESSFULLY ${user.mobile}`);
    return res.status(204).json({ message: "deleted..!" });
  } catch (error) {
    logger.error(`❌failde to delete account ${user?.mobile}`, error);
    return sendResponse(res, 500, "failde to delete account", error);
  }
};

export const donationActive = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️DONATION ACTIVE api hit ${user.mobile}`);
  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          donationActive: !user.donationActive,
        },
      },
      { new: true }
    );
    logger.info(`ℹ️DONATION ACTIVE SUCCESSFULLY ${user.mobile}`);
    return sendResponse(res, 200, "donation active..!");
  } catch (error) {
    logger.error(`❌failde to active donation ${user?.mobile}`, error);
    return sendResponse(res, 500, "failde to active donation", error);
  }
};

export const changeRole = async (req, res) => {
  const { user } = req;
  const { role } = req.body || {};
  logger.info(`ℹ️ CHANGE ROLE api hit ${user.mobile}`);
  try {
    await UserModel.findByIdAndUpdate(
      { _id: user?._id },
      { $set: { role: role } },
      { new: true }
    );

    logger.info(`ℹ️Change role successfully....! ${user.mobile}`);
    return sendResponse(res, 200, "Change role successfully....!");
  } catch (error) {
    logger.error(`❌Change role failed..! ${user?.mobile}`, error);
    return sendResponse(res, 500, "Change role failed..!", error);
  }
};

export const setMPin = async (req, res) => {
  const { user } = req;
  const { mpin } = req.body || {};
  logger.info(`ℹ️ SET M-PIN api hit ${user.mobile}`);

  const result = await setMPinService(user._id, user.mobile, mpin);
  return sendResponse(res, result.status, result.message, result.error || null);
};

export const checkMyPin = async (req, res) => {
  const { user } = req;
  const { mpin } = req.body || {};
  logger.info(`ℹ️ CHECK M-PIN api hit ${user.mobile}`);

  const result = await checkMPinService(user._id, user.mobile, mpin);
  return sendResponse(res, result.status, result.message, result.error || null);
};

export const duttyChange = async (req, res) => {
  const { user } = req;
  const { latitude, longitude, mpin } = req.body || {};
  logger.info(`ℹ️ DUTY-CHANGE api hit ${user.mobile}`);
  const result = await changeDuttyService({
    latitude,
    longitude,
    mpin,
    mobile: user?.mobile,
    userId: user?._id,
    duttyStatus: user?.onDuty,
    userMpin: user?.mpin,
  });
  return sendResponse(res, result.status, result.message, result.error || null);
};

export const updateCoordinates = async (req, res) => {
  const { lat, lng } = req.body || {};
  const { user } = req;
  logger.info(`ℹ️ CAPTAIN UPDATED COORDINATE  api hit ${user.mobile}`);
  const result = await updateCaptainCoordinatesService({
    userId: user._id,
    mobile: user?.mobile,
    lat,
    lng,
  });
  return sendResponse(res, result.status, result.message, result.error || null);
};

export const addEmergencyContact = async (req, res) => {
  const { user } = req;
  const { name, mobile, option } = req.body;
  logger.info(`ℹ️ EMERGENCY CONTACT api hit ${user.mobile}`);
  try {
    const newEmergencyContact = {
      name,
      mobile,
      option: option || "Night ride shared automatically (9PM - 6AM)",
    };

    const contact = await UserModel.findByIdAndUpdate(
      user._id,
      { $push: { emergencyContact: newEmergencyContact } },
      { new: true }
    );
    const redisKey = `emergency_contact:${user?._id}`;
    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(
      res,
      200,
      "Emergency contact added successfully",
      null,
      { contact }
    );
  } catch (error) {
    logger.error(`❌emengency coontact failed ${user?.mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "emengency coontact failed", error);
  }
};

export const getEmergencyContact = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️GET EMERGENCY CONTACT api hit ${user.mobile}`);
  const redisKey = `emergency_contact:${user?._id}`;
  try {
    const cachedData = await getCachedHomePlaces(req.redisClient, redisKey);
    if (cachedData) {
      logger.info(`ℹ️ [GET Home Place] Cache hit for ${user.mobile}`);
      return res.status(200).json(cachedData ?? null);
    }

    const userEmeContcat = await UserModel.findById(user._id);

    const emergencyContact = userEmeContcat?.emergencyContact ?? null;

    await setCachedHomePlaces(req.redisClient, redisKey, emergencyContact);
    return res.status(200).json(emergencyContact);
  } catch (error) {
    logger.error(`❌emengency coontact failed ${user?.mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "emengency coontact failed", error);
  }
};

export const deleteEmergencyContact = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️DELET EMERGENCY CONTACT api hit ${user.mobile}`);
  const { mobileNumber } = req.params;
  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      { $pull: { emergencyContact: { mobile: mobileNumber } } },
      { new: true }
    );
    const redisKey = `emergency_contact:${user?._id}`;
    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 200, "Emergency contact deleted successfully");
  } catch (error) {
    logger.error(
      `❌failed to delete emergency contact ${user?.mobile}: ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(res, 500, "failed to delete emergency contact", error);
  }
};

export const updatedRcDetails = async (req, res) => {
  const { userId, rcNumber } = req.params;
  logger.info(`ℹ️UPDATE RC DETAILS api hit ${userId}`);

  try {
    const updatedService = await updateRcDetailsService(
      userId,
      rcNumber,
      req.body?.data
    );

    return sendResponse(res, 200, "RC details updated successfully", null, {
      updatedService,
    });
  } catch (error) {
    logger.error(`❌ RC Surepass update failed: ${error.message}`, {
      stack: error.stack,
    });

    const statusCode =
      error.message === "Service not found" ||
      error.message === "User not found"
        ? 404
        : 500;
    return sendResponse(res, statusCode, error.message, error);
  }
};

export const updatedLicenseDetails = async (req, res) => {
  const { userId } = req.params;
  logger.info(`ℹ️UPDATE LICENSE DETAILS api hit ${userId}`);

  try {
    await updateLicenseDetailsService(userId, req.body?.data);
    return sendResponse(res, 200, "License details updated successfully");
  } catch (error) {
    logger.error(`❌License details update failed ${userId}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "License details update failed", error);
  }
};

export const updatedPanNumber = async (req, res) => {
  const { userId } = req.params;
  logger.info(`ℹ️UPDATE PAN DETAILS api hit ${userId}`);

  const panCardDetails = {
    pan: req.body?.data?.pan_number,
    name: req.body?.data?.full_name,
  };

  try {
    await UserModel.findByIdAndUpdate(
      { _id: userId },
      { $set: { panCardDetails: panCardDetails } },
      { new: true }
    );

    return sendResponse(res, 200, "Pan card details updated successfully");
  } catch (error) {
    logger.error(`❌ PAN details update failed ${userId}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "PAN details update failed", error);
  }
};

export const switchActiveServices = async (req, res) => {
  const { user } = req;
  const { title } = req.body;
  logger.info(`ℹ️SWITCH DIFFERENT SERVICE api hit ${user.mobile}- ${title}`);
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: { activeService: title } },
      { new: true }
    );

    return sendResponse(res, 200, "", null, { user: updatedUser });
  } catch (error) {
    logger.error(
      `❌Failed to update active services ${user?.mobile}: ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(res, 500, "Failed to update active services", error);
  }
};

export const addBankDetails = async (req, res) => {
  const { user } = req;
  const { bankDetails } = req.body;
  logger.info(`ℹ️ADD BANK DETAILS api hit ${user.mobile}`);

  try {
    if (!Array.isArray(user.bankDetails)) {
      user.bankDetails = [];
    }

    user.bankDetails.push(bankDetails);
    await user.save();
    return sendResponse(res, 200, "Bank details added", null, { user });
  } catch (error) {
    logger.error(`❌Error adding bank details: ${user?.mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Error adding bank details:", error);
  }
};
