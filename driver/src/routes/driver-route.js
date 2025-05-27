import express from "express";
import {
  addHomePlaces,
  deleteHomePlace,
  getHomePlaces,
  selectedHomePlace,
} from "../controllers/driver-controller.js";
import { authenticateRequest } from "../middlewares/authenticationMidd.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/add-home-places", addHomePlaces);
router.get("/home-places", getHomePlaces);
router.delete("/home-places/:placeId", deleteHomePlace);
router.patch("/selected-home-places/:placeId", selectedHomePlace);

export default router;
