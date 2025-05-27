import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { sendError } from "../utils/send-error.js";

export const allServiceAuthMiddleWare = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("⚠️ Access attempt without valid token!");
    return sendError(res, 401, "Authentication required");
  }

  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, user) => {
    if (err) {
      logger.error("❌ err", err);
      logger.warn("⚠️ Invalid token!");
      return sendError(res, 404, "Invalid token!");
    }

    req.user = user;
    next();
  });
};
