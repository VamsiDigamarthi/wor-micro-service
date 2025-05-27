import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import proxy from "express-http-proxy";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import { sendError } from "./utils/send-error.js";
import { conditionalValidateToken } from "./middlewares/authMiddleware.js";
import { allServiceAuthMiddleWare } from "./middlewares/allServiceAuthMiddleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   logger.info(`Received ${req.method} request to ${req.url}`);
//   logger.info(`Request body, ${req.body}`);
//   next();
// });

app.use(errorHandler);

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    sendError(res, 500, "Internal server error Through PROXY", err);
  },
};

app.use(
  "/v1/auth",
  conditionalValidateToken,
  proxy(process.env.AUTH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // proxyReqOpts.headers["Content-Type"] = "application/json";
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-number"] = srcReq.user.mobile;
        proxyReqOpts.headers["x-user-id"] = srcReq.user.id;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Auth service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(
  "/v1/ride",
  allServiceAuthMiddleWare,
  proxy(process.env.RIDE_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // console.log("rcReq", srcReq);

      proxyReqOpts.headers["Content-Type"] = "application/json";
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-number"] = srcReq.user.mobile;
        proxyReqOpts.headers["x-user-id"] = srcReq.user.id;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Auth service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// USER SERVICE
app.use(
  "/v1/user",
  allServiceAuthMiddleWare,
  proxy(process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-number"] = srcReq.user.mobile;
        proxyReqOpts.headers["x-user-id"] = srcReq.user.id;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Auth service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(
  "/v1/captain",
  allServiceAuthMiddleWare,
  proxy(process.env.CAPTAIN_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-number"] = srcReq.user.mobile;
        proxyReqOpts.headers["x-user-id"] = srcReq.user.id;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Auth service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
});
