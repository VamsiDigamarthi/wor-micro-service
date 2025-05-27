import OnDutyCaptain from "../modals/duty-change-users.js";
import logger from "../utils/logger.js";

export const handleOndutyCaptains = async (event) => {
  const { captainId, mobile, location } = event;

  try {
    await OnDutyCaptain.create({
      captainId,
      mobile,
      location: {
        type: "Point",
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
      },
    });
    logger.info(`✅ Captain ${mobile} added to on-duty list`);
  } catch (error) {
    logger.error(`❌Failed to added on-dutty ${mobile}: ${error}`, {
      stack: error.stack,
    });
  }
};

export const handleOffdutyCaptains = async (event) => {
  const { captainId, mobile } = event;
  try {
    await OnDutyCaptain.deleteOne({ captainId });
    logger.info(`🗑️ Captain ${mobile} removed from on-duty list`);
  } catch (error) {
    logger.error(`❌Failed to added on-dutty ${mobile}: ${error}`, {
      stack: error.stack,
    });
  }
};
