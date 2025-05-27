import RatingModel from "../modal/RatingModal.js";
import { publishEvent } from "../rabbitmq/rabbitmq.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/send-error.js";

export const postRating = async (req, res) => {
  logger.info("ℹ️ POST RATING  api hit");
  const { mobile, userId: authUserId } = req.user;
  const { orderId, rating, ratingText, userId } = req.body;
  if (!orderId || !rating || !userId)
    return sendResponse(res, 400, "Missing required fields.");

  try {
    const ratingDoc = new RatingModel({
      user: userId,
      orderId,
      rating,
      text: ratingText,
      author: authUserId,
    });
    await ratingDoc.save();

    // publish event to ride service to store rating of each order
    await publishEvent("rating.post", {
      orderId,
      rating,
    });

    // publish event to auth service to cal avg of rating
    await publishEvent("rating.postFromRatingSer", {
      authUserId,
      rating,
    });

    return sendResponse(res, 200, "Rating posted successfully.");
  } catch (error) {
    logger.error(`❌ Failed to post rating : ${mobile} ${error}`);
    return sendResponse(res, 500, "Failed to post rating.", error);
  }
};

export const getratings = async (req, res) => {};

export const notGivenRating = async (req, res) => {};

export const fetchRatingorder = async (req, res) => {};

export const fetchCaptainRating = async (req, res) => {};
