import jwt from "jsonwebtoken";
import { match } from "path-to-regexp";
import logger from "../utils/logger.js";
import { sendError } from "../utils/send-error.js";

// Define public routes (supports dynamic params)
const publicRoutes = [
  "/send-otp",
  "/verify-otp",
  "/register",
  "/remove-otp",
  "/services",
  "/update-rc-number/:mobile",
  "/userwithmobile/:mobile",
];

// Create matchers from the public routes
const publicMatchers = publicRoutes.map((route) =>
  match(route, { decode: decodeURIComponent })
);

export const conditionalValidateToken = (req, res, next) => {
  const path = req.path;

  // Check if the request path matches any public route pattern
  const isPublicRoute = publicMatchers.some((matcher) => matcher(path));

  if (isPublicRoute) {
    return next(); // Skip token validation
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("⛔ Access attempt without a valid token");
    return sendError(res, 401, "Authentication required");
  }

  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, user) => {
    if (err) {
      logger.warn("⛔ Invalid token");
      return sendError(res, 401, "Invalid token");
    }

    req.user = user;
    next(); // Token is valid, proceed to route handler
  });
};
