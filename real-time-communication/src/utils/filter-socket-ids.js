import { redisClient } from "../redis/redisClient.js";

export const getCaptainSocketInfo = async (captains) => {
  const result = {
    socketIds: [],
    notConnectedCaptains: [],
  };

  // Get all captain ID → socketId mappings from Redis
  const captainIdToSocketId = await redisClient.hgetall("captainIds");

  for (const captain of captains) {
    const captainId = captain._id?.toString(); // assuming _id is ObjectId

    const socketId = captainIdToSocketId[captainId];
    if (socketId) {
      result.socketIds.push(socketId);
    } else {
      result.notConnectedCaptains.push(captain);
    }
  }

  return result;
};

export const getUserSocketId = async (orderId, userType) => {
  const key = `rideLiveCommunication:${orderId}`;
  const socketId = await redisClient.hget(key, userType);
  return socketId || null;
};
