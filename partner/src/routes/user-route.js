import express from "express";
import { authenticateRequest } from "../middlewares/authenticationMidd.js";
import {
  addedHomePlaces,
  addFavoriteLocation,
  deleteHomePlace,
  editHomePlace,
  fetchFavoriteLocation,
  getHomePlaces,
} from "../controllers/user-controller.js";
const router = express.Router();

router.use(authenticateRequest);

router.post("/home-place", addedHomePlaces);
router.get("/home-place", getHomePlaces);
router.patch("/home-place/:id", editHomePlace);
router.delete("/home-place/:id", deleteHomePlace);
router.post("/favorites-places", addFavoriteLocation);
router.get("/favorites-places", fetchFavoriteLocation);

export default router;
