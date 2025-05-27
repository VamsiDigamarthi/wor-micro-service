import {
  changeDuttyService,
  getWithdrawRequestService,
  handleWithdrawRequestService,
  updateCaptainCoordinatesService,
  withdrawRequestPayService,
} from "../service/captain-auth-service.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/send-error.js";

export const withdrawRequest = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️WITHDRAW REQUEST api hit ${user.mobile}`);

  try {
    const updatedUser = await handleWithdrawRequestService(req.body, user);
    return sendResponse(
      res,
      200,
      "Withdraw request submitted successfully",
      null,
      { user: updatedUser }
    );
  } catch (error) {
    logger.error(`❌Withdraw Request Failed: ${user?.mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Error adding bank details:", error);
  }
};

export const getWidarwRequest = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️GET WITHDRAW REQUEST API hit by ${user.mobile}`);
  const { page = 1, limit = 10, fromDate } = req.query;

  try {
    const data = await getWithdrawRequestService({ page, limit, fromDate });
    return sendResponse(res, 200, "Withdraw requests fetched", null, data);
  } catch (error) {
    logger.error(
      `❌constWithdraw Request fetching  Failed ${user?.mobile}: ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(res, 500, "Withdraw Request fetching  Failed", error);
  }
};

export const widthdrawRequestPay = async (req, res) => {
  const { user } = req;
  logger.info(`ℹ️ WITHDRAW REQUEST PAY api hit by ${user.mobile}`);

  try {
    const updatedRequest = await withdrawRequestPayService(id);
    if (!updatedRequest)
      return sendResponse(res, 404, "Withdraw request not found");

    return sendResponse(res, 200, "Payment marked successfully");
  } catch (error) {
    logger.error(`❌withdra request paying failed ${user?.mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "withdra request paying failed", error);
  }
};

// change duty
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
    activeService: user?.activeService,
  });
  return sendResponse(res, result.status, result.message, result.error || null);
};

// update coordinates
export const updateCoordinates = async (req, res) => {
  const { lat, lng } = req.body || {};
  const { user } = req;
  logger.info(`ℹ️ CAPTAIN UPDATED COORDINATE  api hit ${user.mobile}`);
  const result = await updateCaptainCoordinatesService({
    userId: user._id,
    mobile: user?.mobile,
    latitude: lat,
    longitude: lng,
  });
  return sendResponse(res, result.status, result.message, result.error || null);
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
