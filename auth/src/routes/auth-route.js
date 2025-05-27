import express from "express";
import {
  deletionRequest,
  checkDeviceId,
  fetchProfile,
  onRemoveOtp,
  register,
  sendOtp,
  verifyOtp,
  editProfile,
  editProfileData,
  onAadharCardVerification,
  updateFirebaseToken,
  addedNewService,
  rcNumberUpdate,
  addedNewServices,
  vehicleImageUpload,
  changeMPin,
  setRoleInCaptainAuthCheck,
  storeDocsData,
  deletAccount,
  donationActive,
  changeRole,
  setMPin,
  checkMyPin,
  duttyChange,
  updateCoordinates,
  addEmergencyContact,
  getEmergencyContact,
  deleteEmergencyContact,
  updatedRcDetails,
  updatedLicenseDetails,
  updatedPanNumber,
  switchActiveServices,
  addBankDetails,
} from "../controllers/authController.js";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/fileUpload.js";
import { handleMulterUpload } from "../media/handleMulterUpload.js";
import {
  getWidarwRequest,
  widthdrawRequestPay,
  withdrawRequest,
} from "../controllers/captain-auth-controller.js";

const router = express.Router();

//
router.patch(
  "/edit-profile",
  authenticateRequest,
  handleMulterUpload(upload.single("profilePic")),
  editProfile
);

router.patch(
  "/update-rc-details/:mobile",
  authenticateRequest,
  handleMulterUpload(
    upload.fields([
      { name: "rcFrontImage", maxCount: 1 },
      { name: "rcBackImage", maxCount: 1 },
      { name: "vehicleFrontImage", maxCount: 1 },
      { name: "vehicleBackImage", maxCount: 1 },
      { name: "vehicleRightImage", maxCount: 1 },
      { name: "vehicleLeftImage", maxCount: 1 },
      { name: "vehicleNumberPlate", maxCount: 1 },
      { name: "vehicleHelmetImage", maxCount: 1 },
      { name: "insuranceImg", maxCount: 1 },
      { name: "fitnessCer", maxCount: 1 },
    ])
  ),
  vehicleImageUpload
);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.patch("/remove-otp", onRemoveOtp);

router.patch("/check-device", authenticateRequest, checkDeviceId);
router.get("/profile", authenticateRequest, fetchProfile);
router.patch("/account-deletion-request", authenticateRequest, deletionRequest);
router.patch("/edit-user-data", authenticateRequest, editProfileData);
router.patch(
  "/aadhar-card-verification/:mobile/:aadharNumber",
  onAadharCardVerification
);
router.patch("/fbtoken", authenticateRequest, updateFirebaseToken);
router.patch("/update-rc-number/:mobile", rcNumberUpdate);
router.patch("/change-mpin", authenticateRequest, changeMPin);
router.get("/userwithmobile/:mobile", setRoleInCaptainAuthCheck);
router.patch("/store-docts-number/:mobile", storeDocsData);
router.delete("/delete-account", authenticateRequest, deletAccount);
router.patch("/donation-active", authenticateRequest, donationActive);
router.patch("/change-role", changeRole);
router.patch("/m-pin", authenticateRequest, setMPin);
router.patch("/check-mpin", authenticateRequest, checkMyPin);
router.patch("/emergency-contact", authenticateRequest, addEmergencyContact);
router.get("/emergency-contact", authenticateRequest, getEmergencyContact);
router.patch(
  "/delete-emergency-contact/:mobileNumber",
  authenticateRequest,
  deleteEmergencyContact
);
router.patch("/rc-details-update/:userId/:rcNumber", updatedRcDetails);
router.patch("/lince-details-update/:userId", updatedLicenseDetails);
router.patch("/pan-updated/:userId", updatedPanNumber);

// captain stuff
router.patch("/change-dutty", authenticateRequest, duttyChange);
router.patch("/services", addedNewService);
router.patch("/update-coordinates", authenticateRequest, updateCoordinates);
router.patch("/added-new-services", authenticateRequest, addedNewServices);
router.patch("/active-services", authenticateRequest, switchActiveServices);
router.patch("/add-bank-details", authenticateRequest, addBankDetails);
router.get("/withdraw-request", getWidarwRequest);
router.patch("/withdraw-request", authenticateRequest, withdrawRequest);
router.patch("/withdraw-request-pay/:id", widthdrawRequestPay);

export default router;
