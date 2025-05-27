import HomePlacesModel from "../modals/HomePlaces.js";
import logger from "../utils/logger.js";

export const handleChangehomePlaceStatus = async (event) => {
  const { userId } = event;
  try {
    await HomePlacesModel.updateMany(
      { head: userId },
      { $set: { isSelected: false } }
    );
    logger.info(`✅Change home place status CaptainId - ${userId}`);
  } catch (error) {
    logger.error(`❌Failed change home place status:  ${error}`, {
      stack: error.stack,
    });
  }
};
