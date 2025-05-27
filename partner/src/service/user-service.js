import FavoriteModel from "../modals/FavoritePlaceModal.js";
import NewHomePlacesModel from "../modals/NewHomePlaces.js";
import logger from "../utils/logger.js";
import { getCachedHomePlaces, setCachedHomePlaces } from "../utils/redis.js";

export const getHomePlacesService = async (redisClient, userId, mobile) => {
  const redisKey = `home_places:${userId}`;

  const cachedData = await getCachedHomePlaces(redisClient, redisKey);
  if (cachedData) {
    logger.info(`ℹ️ [GET Home Place] Cache hit for ${mobile}`);
    return cachedData;
  }

  const [home, work, otherHomePlaces] = await Promise.all([
    NewHomePlacesModel.findOne(
      { head: userId, type: "home" },
      { location: 1, _id: 1, name: 1, vicinity: 1 }
    ),
    NewHomePlacesModel.findOne(
      { head: userId, type: "work" },
      { location: 1, _id: 1, name: 1, vicinity: 1 }
    ),
    NewHomePlacesModel.find(
      { head: userId, type: { $nin: ["home", "work"] } },
      { location: 1, _id: 1, name: 1, vicinity: 1, type: 1 }
    ),
  ]);

  const responsePayload = {
    home: home ?? null,
    work: work ?? null,
    otherHomePlace: otherHomePlaces?.length ? otherHomePlaces : null,
  };

  await setCachedHomePlaces(redisClient, redisKey, responsePayload);
  return responsePayload;
};

export const onAddFavoriteLocationService = async (
  userId,
  { name, vicinity, location }
) => {
  const existingLocation = await FavoriteModel.findOne({ name, head: userId });

  if (existingLocation) {
    await FavoriteModel.findByIdAndDelete(existingLocation._id);
    return {
      status: 200,
      message: "Favorite location removed successfully...",
    };
  }

  const newFavoriteLocation = new FavoriteModel({
    name,
    vicinity,
    location: {
      type: "Point",
      coordinates: [parseFloat(location?.lng), parseFloat(location?.lat)],
    },
    head: userId,
  });

  await newFavoriteLocation.save();

  return {
    status: 201,
    message: "Favorite location added successfully..!",
  };
};

export const fetchFavoriteLocationService = async (
  redisClient,
  userId,
  mobile
) => {
  const redisKey = `favorite_places:${userId}`;
  const cachedData = await getCachedHomePlaces(redisClient, redisKey);
  if (cachedData) {
    logger.info(`ℹ️ [GET FAVORITE LOCATION] Cache hit for ${mobile}`);
    return cachedData;
  }

  const favoriteLocations = await FavoriteModel.find({ head: userId });
  await setCachedHomePlaces(redisClient, redisKey, favoriteLocations);
  return favoriteLocations;
};
