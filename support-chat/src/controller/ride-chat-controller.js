import RideChatModel from "../modal/RideChatModal.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/senResponse.js";

export const addMessageFromRideChat = async (req, res) => {
  const { orderId, text, sender, userId } = req.body;
  const message = { sender, text, timestamp: new Date() };

  try {
    await RideChatModel.findOneAndUpdate(
      { orderId },
      {
        $push: {
          messages: message, // Directly push the `message` object with all required fields
        },
      },
      { new: true, upsert: true }
    );
    return sendResponse(res, 200, "message added");
  } catch (error) {
    logger.error(
      `❌Failed to  push message from ride chat ${mobile}, ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(
      res,
      500,
      "Failed to fetch push message from ride chat",
      error
    );
  }
};
