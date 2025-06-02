import SupportChatModel from "../modal/SupportChatModal.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/senResponse.js";

export const getUnreadMessages = async (req, res) => {
  const { mobile } = req.user;
  const { userId, chatId } = req.params;
  logger.info(`ℹ️ [SUPPORTED CHAT UNREAD] API hit by ${mobile}`);
  try {
    const chat = await SupportChatModel.findOne(
      { _id: chatId, "participants.participantId": userId },
      { "participants.$": 1 } // Project only the matched participant
    );

    if (!chat) return sendResponse(res, 404, "Support chat not found");
    return sendResponse(res, 200, "", null, { chat });
  } catch (error) {
    logger.error(
      `❌Failed to fetch unread messages from support chat ${mobile}, ${error}`,
      {
        stack: error.stack,
      }
    );
    return sendResponse(
      res,
      500,
      "Failed to fetch unread messages from support chat",
      error
    );
  }
};
