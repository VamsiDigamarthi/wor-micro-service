import express from "express";
import {
  placeOrder,
  pendingOrders,
  fetchAllOrders,
  rideDeletRequest,
  rePlaceOrder,
  addFavoriteOrder,
  fetchAllFaviouriteOrder,
  cancelOrder,
  changeDestinationPlace,
  fetchLastOrder,
  addedTip,
  changePaymentMethod,
  removeTip,
  middleDropRejection,
  confirmMiddleDrop,
} from "../controllers/user-ride-controller.js";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import {
  acceptChangeDestiona,
  acceptOrder,
  allCompletedOrders,
  captainArrived,
  collectCash,
  fetchAcceptOrders,
  fetchActiveOrders,
  getDayWiseEarning,
  getHighDemandAreas,
  middleDrop,
  orderCompleted,
  ordersDeclaine,
  otpVerification,
  todayEarnings,
} from "../controllers/captain-ride-controller.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/place-order", placeOrder);
router.get("/all-orders", pendingOrders);
router.get("/all-order", fetchAllOrders);
router.patch("/ride-delete-request/:orderId", rideDeletRequest);
router.patch("/re-place-order/:orderId", rePlaceOrder);
router.patch("/favourite/:orderId", addFavoriteOrder);
router.get("/favourite-orders", fetchAllFaviouriteOrder);
router.patch("/cancel-order/:orderId", cancelOrder);
router.patch("/change-destination", changeDestinationPlace);
router.get("/last-order", fetchLastOrder);
router.patch("/add-tip", addedTip);
router.patch("/remove-tip/:orderId", removeTip);
router.patch("/change-payment-method/:orderId", changePaymentMethod);
router.patch("/middle-drop-rejection/:orderId", middleDropRejection);
router.patch("/middle-drop-accept/:orderId", confirmMiddleDrop);

// captains
router.get("/orders/:lng/:lat/:distance/:currentData", fetchActiveOrders);
router.patch("/accept-order/:orderId", acceptOrder);
router.patch("/orders-rejected/:orderId", ordersDeclaine);
router.patch("/arrived/:orderId", captainArrived);
router.patch("/order-otp-verified/:orderId", otpVerification);
router.patch("/order-completed/:orderId", orderCompleted);
router.get("/active-order", fetchAcceptOrders);
router.patch("/accept-reject-change-destination", acceptChangeDestiona);
router.patch("/cash-collect/:orderId", collectCash);
router.patch("/middle-drop/:orderId", middleDrop);
router.get("/completed-all-orders", allCompletedOrders);
router.get("/day-wise-earnings/:date", getDayWiseEarning);
router.patch("/today-earnings", todayEarnings);
router.get("/high-demand-areas", getHighDemandAreas);

export default router;
