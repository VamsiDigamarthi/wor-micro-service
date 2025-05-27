import {
  getWithdrawRequestService,
  handleWithdrawRequestService,
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
