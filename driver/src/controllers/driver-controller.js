import HomePlacesModel from "../modals/HomePlaces.js";
import {
  getCachedHomePlaces,
  removeCacheByKey,
  setCachedHomePlaces,
} from "../redis/redis.js";
import { createHomePlaces } from "../service/driver-service.js";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/sendResponse.js";
import homePlaceValidationSchema from "../utils/validations.js";

export const addHomePlaces = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [Add Home Place] API hit by ${mobile}`);
  const { placeName, placeVicinity, latitude, longitude } = req.body;
  const payload = {
    placeName,
    placeVicinity,
    placeLocation: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    head: userId,
  };

  const { error } = homePlaceValidationSchema(payload);
  if (error) {
    logger.warn(`⚠️ [Validation Failed] ${error.details[0].message}`);
    return sendResponse(res, 400, error.details[0].message);
  }

  try {
    const homePlace = await createHomePlaces(payload);

    const redisKey = `captain_home_places:${userId}`;
    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 201, "Home place added successfully", null, {
      homePlace,
    });
  } catch (error) {
    logger.error(`❌failed to added home places ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "failed to added home places", error);
  }
};

export const getHomePlaces = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [GET Home Place] API hit by ${mobile}`);
  const redisKey = `captain_home_places:${userId}`;
  try {
    const cachedData = await getCachedHomePlaces(req.redisClient, redisKey);
    if (cachedData) {
      logger.info(`ℹ️ [GET ALL ORDERS] Cache hit for ${mobile}`);
      return sendResponse(res, 200, "all orders", null, {
        homePlaces: cachedData,
      });
    }

    const homePlaces = await HomePlacesModel.find({ head: userId });
    await setCachedHomePlaces(req.redisClient, redisKey, homePlaces);

    return sendResponse(res, 200, "", null, { homePlaces });
  } catch (error) {
    logger.error(`❌failed to get home places ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "failed to get home places", error);
  }
};

export const deleteHomePlace = async (req, res) => {
  const { mobile, userId } = req.user;
  const { placeId } = req.params;
  logger.info(`ℹ️ [DELETE Home Place] API hit by ${mobile}`);
  const redisKey = `captain_home_places:${userId}`;

  if (!placeId) return sendResponse(res, 200, "Place ID is required");

  try {
    await HomePlacesModel.findByIdAndDelete({ _id: placeId, head: userId });

    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 204, "Home place deleted successfully");
  } catch (error) {
    logger.error(`❌Failed to delete home place ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to delete home place", error);
  }
};

export const selectedHomePlace = async (req, res) => {
  const { mobile, userId } = req.user;
  const { placeId } = req.params;
  logger.info(`ℹ️ [SELECT Home Place] API hit by ${mobile}`);
  const redisKey = `captain_home_places:${userId}`;

  if (!placeId) return sendResponse(res, 200, "Place ID is required");

  try {
    const prevHomePlace = await HomePlacesModel.findById(placeId);

    await HomePlacesModel.updateMany(
      { head: userId },
      { $set: { isSelected: false } }
    );

    await HomePlacesModel.findByIdAndUpdate(placeId, {
      isSelected: !prevHomePlace.isSelected,
    });

    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 200, "Home place selected successfully");
  } catch (error) {
    logger.error(`❌Failed to select home place ${mobile}: ${error}`, {
      stack: error.stack,
    });
    return sendResponse(res, 500, "Failed to select home place", error);
  }
};
