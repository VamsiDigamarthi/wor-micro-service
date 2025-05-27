import UserModel from "../modals/UserModal.js";
import logger from "../utils/logger.js";

export async function ratingEventHandler(event, routingKey) {
  try {
    switch (routingKey) {
      case "rating.postFromRatingSer":
        return await addedEachOrderratingSum(event);

      default:
        logger.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    logger.error(`❌ Error handling ${routingKey}:`, err);
  }
}

const addedEachOrderratingSum = async (event) => {
  const { authUserId, rating } = event;
  logger.info(
    `ℹ️ SUM OF RATING EVENT HIT for user: ${authUserId}, rating: ${rating}`
  );

  try {
    const user = await UserModel.findById(authUserId);
    if (!user) {
      logger.error(`❌User not found: ${authUserId}`);
      return;
    }

    const newRatingCount = user.ratingCount + 1;
    const newRatingTotal = user.ratingTotal + rating;
    const newAvgRating = newRatingTotal / newRatingCount;

    await UserModel.findByIdAndUpdate(authUserId, {
      $set: {
        avgRating: newAvgRating.toFixed(2),
        ratingCount: newRatingCount,
        ratingTotal: newRatingTotal,
      },
    });

    logger.info(
      `✅ Updated avgRating to ${newAvgRating.toFixed(
        2
      )} for user: ${authUserId}`
    );
  } catch (error) {
    logger.error(
      `❌Failed to update avg rating for user ${authUserId}: ${error}`,
      {
        stack: error.stack,
      }
    );
  }
};
