import FavoriteModel from "../modals/FavoritePlaceModal.js";
import NewHomePlacesModel from "../modals/NewHomePlaces.js";
import {
  fetchFavoriteLocationService,
  getHomePlacesService,
  onAddFavoriteLocationService,
} from "../service/user-service.js";
import logger from "../utils/logger.js";
import {
  getCachedHomePlaces,
  removeCacheByKey,
  setCachedHomePlaces,
} from "../utils/redis.js";
import { sendResponse } from "../utils/sendResponse.js";
import { validateNewHomePlace } from "../utils/validation.js";

export const addedHomePlaces = async (req, res) => {
  const { mobile, userId } = req.user;
  const payload = { ...req.body, head: userId };
  logger.info(`ℹ️ [Add Home Place] API hit by ${mobile}`);

  const { error } = validateNewHomePlace(payload);
  if (error) {
    logger.warn(`⚠️ [Validation Failed] ${error.details[0].message}`);
    return sendResponse(res, 400, error.details[0].message);
  }

  try {
    const newPlace = await NewHomePlacesModel.create(payload);

    const redisKey = `home_places:${userId}`;
    await removeCacheByKey(req.redisClient, redisKey);

    logger.info(`✅ [Home Place Added] by ${mobile}, cache cleared`);
    return sendResponse(res, 200, "Place saved successfully", null, newPlace);
  } catch (err) {
    logger.error(`❌ [Add Home Place Failed] ${mobile}, ${err}`);
    return sendResponse(res, 500, "Failed to add home place", err);
  }
};

export const getHomePlaces = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [GET Home Place] API hit by ${mobile}`);
  const redisKey = `home_places:${userId}`;
  try {
    const cachedData = await getCachedHomePlaces(req.redisClient, redisKey);
    if (cachedData) {
      logger.info(`ℹ️ [GET Home Place] Cache hit for ${mobile}`);
      return sendResponse(res, 200, "Home Places", null, cachedData);
    }

    const data = await getHomePlacesService(req.redisClient, userId, mobile);
    return sendResponse(res, 200, "Home Places", null, data);
  } catch (error) {
    logger.error(`❌ [GET Home Place Failed] ${mobile}, ${error}`);
    return sendResponse(res, 500, "Failed to GET Home Place", error);
  }
};

export const editHomePlace = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [EDIT Home Place] API hit by ${mobile}`);

  const { name, vicinity, location } = req.body;
  const { id } = req.params;
  try {
    const updatedHomePlace = await NewHomePlacesModel.findByIdAndUpdate(id, {
      $set: { name, vicinity, location },
    });

    if (!updatedHomePlace)
      return sendResponse(res, 404, "Home place not found");

    const redisKey = `home_places:${userId}`;
    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 200, "Home place updated successfully");
  } catch (error) {
    logger.error(`❌Failed to edit home screen ${mobile}, ${error}`);
    return sendResponse(res, 500, "Failed to edit home screen", error);
  }
};

export const deleteHomePlace = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [DELET Home Place] API hit by ${mobile}`);

  const { id } = req.params;
  try {
    await NewHomePlacesModel.findOneAndDelete({ _id: id, head: userId });
    const redisKey = `home_places:${userId}`;

    await removeCacheByKey(req.redisClient, redisKey);
    return sendResponse(res, 200, "saved places deleted succesfully.!");
  } catch (error) {
    logger.error(`❌Failed to delet home screen ${mobile}, ${error}`);
    return sendResponse(res, 500, "Failed to delet home screen", error);
  }
};

export const addFavoriteLocation = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [ADD FAVORITE LOCATION] API hit by ${mobile}`);
  const { name, vicinity, location } = req.body;
  try {
    const result = await onAddFavoriteLocationService(userId, {
      name,
      vicinity,
      location,
    });
    const redisKey = `favorite_places:${userId}`;
    await removeCacheByKey(req.redisClient, redisKey);

    logger.info(`ℹ️ [ADD FAVORITE LOCATION SUCCESSFULLY] ${mobile}`);
    return sendResponse(res, result?.status, result?.message);
  } catch (error) {
    logger.error(`❌Error adding favorite location ${mobile}, ${error}`);
    return sendResponse(res, 500, "Error adding favorite location", error);
  }
};

export const fetchFavoriteLocation = async (req, res) => {
  const { mobile, userId } = req.user;
  logger.info(`ℹ️ [GET FAVORITE LOCATION] API hit by ${mobile}`);

  try {
    const result = await fetchFavoriteLocationService(
      req.redisClient,
      userId,
      mobile
    );

    return sendResponse(res, 200, "", null, { favoriteLocations: result });
  } catch (error) {
    logger.error(`❌failed to fetch favorite location ${mobile}, ${error}`);
    return sendResponse(res, 500, "failed to fetch favorite location", error);
  }
};
