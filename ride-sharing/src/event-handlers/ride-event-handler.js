import OnDutyCaptain from "../modals/duty-change-users.js";
import logger from "../utils/logger.js";

export async function unifiedHandler(event, routingKey) {
  try {
    switch (routingKey) {
      case "captain.onDuty":
        return await handleOndutyCaptains(event);
      case "captain.offDuty":
        return await handleOffdutyCaptains(event);
      case "captain.locationUpdate":
        return await handleUpdateCaptainsLocation(event);
      default:
        console.warn(`⚠️ Unknown routing key: ${routingKey}`);
    }
  } catch (err) {
    console.error(`❌ Error handling ${routingKey}:`, err);
  }
}

const handleOndutyCaptains = async (event) => {
  const { captainId, mobile, location, activeService } = event;
  console.log("activeService", activeService);

  if (!location || !location.latitude || !location.longitude) {
    logger.error("❌ Invalid location received", { data });
    return;
  }

  try {
    const existingCaptain = await OnDutyCaptain.findOne({ captainId });

    if (existingCaptain) {
      logger.info(
        `ℹ️ Captain ${mobile} is already on-duty. Skipping creation.`
      );
      return;
    }

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
      activeService,
    });
    logger.info(`✅ Captain ${mobile} added to on-duty list`);
  } catch (error) {
    logger.error(`❌Failed to added on-dutty ${mobile}: ${error}`, {
      stack: error.stack,
    });
  }
};

const handleOffdutyCaptains = async (event) => {
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

const handleUpdateCaptainsLocation = async (event) => {
  const { captainId, location, mobile } = event;

  if (!location || !location.latitude || !location.longitude) {
    logger.error("❌ Invalid location received", { event });
    return;
  }

  try {
    const updated = await OnDutyCaptain.findOneAndUpdate(
      { captainId },
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [
              parseFloat(location.longitude),
              parseFloat(location.latitude),
            ],
          },
        },
      },
      { new: true } // Returns the updated document
    );

    if (updated) {
      logger.info(`📍 Location updated for captain ${mobile}`);
    } else {
      logger.warn(`⚠️ No on-duty captain found with ID ${mobile}`);
    }
  } catch (error) {
    logger.error(`❌ Captain location update failed ${mobile}: ${error}`, {
      stack: error.stack,
    });
  }
};
