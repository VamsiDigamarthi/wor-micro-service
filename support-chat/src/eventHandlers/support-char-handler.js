import SupportChatModel from "../modal/SupportChatModal.js";

export const createSupportChat = async (event) => {
  console.log(event, "eventevent");
  const { userId, adminUserId } = event;
  try {
    const chat = new SupportChatModel({
      participants: [
        { participantId: userId, participantModel: "User" }, // Regular user
        { participantId: adminUserId, participantModel: "AdminUsers" }, // Admin user
      ],
    });
    await chat.save();
  } catch (error) {
    logger.error("Error occured create support chat", error);
  }
};
