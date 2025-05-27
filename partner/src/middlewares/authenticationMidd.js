import logger from "../utils/logger.js";
import { sendResponse } from "../utils/sendResponse.js";

export const authenticateRequest = async (req, res, next) => {
  const mobile = req.headers["x-user-number"];
  const userId = req.headers["x-user-id"];

  if (!mobile) {
    logger.warn(
      `Access attempted without user mobile in auth-services middleware`
    );
    return sendResponse(res, 401, "Authencation required!");
  }
  req.user = { mobile, userId };
  next();
};
