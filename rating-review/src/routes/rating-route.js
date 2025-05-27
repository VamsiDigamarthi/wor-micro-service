import express from "express";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import {
  fetchCaptainRating,
  fetchRatingorder,
  getratings,
  notGivenRating,
  postRating,
} from "../controllers/rating-controller.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/", postRating);
router.get("/", getratings);
router.patch("/not-given-rating", notGivenRating);
router.get("/get-order-by-rating", fetchRatingorder);
router.get("/captain-rating", fetchCaptainRating);

export default router;
