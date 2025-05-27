import UserModel from "../modals/UserModal.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/send-error.js";

export const authenticateRequest = async (req, res, next) => {
  const mobile = req.headers["x-user-number"];
  const id = req.headers["x-user-id"];

  if (!mobile) {
    logger.warn(
      `Access attempted without user mobile in auth-services middleware`
    );
    return sendResponse(res, 401, "Authencation required!");
  }

  try {
    const existingUser = await UserModel.findOne({ mobile });

    if (!existingUser) {
      logger.warn(`User not found for mobile: ${mobile} and id: ${id}`);
      return res
        .status(404)
        .json({ message: "This user is no longer available" });
    }

    req.user = existingUser;
    next();
  } catch (error) {
    logger.error("Error in authenticateRequest middleware:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};
