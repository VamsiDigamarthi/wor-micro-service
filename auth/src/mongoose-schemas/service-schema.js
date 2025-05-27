import mongoose from "mongoose";
const { Schema } = mongoose;

export const serviceSchema = new Schema(
  {
    entireServicesVerifies: {
      type: String,
      enum: ["initial", "pending", "rejected", "verified"],
      default: "initial",
    },
    serviceType: {
      type: String,
      enum: [
        "scooty",
        "car",
        "bookany",
        "auto",
        "wor-premium",
        "parcel",
        "scooty-lite",
      ],
      default: null,
    },
    rcVerificationStatuc: {
      type: String,
      enum: ["initial", "pending", "rejected", "verified"],
      default: "initial",
    },
    rcNumber: { type: String, default: null },
    rcFrontImage: { type: String, default: null },
    rcBackImage: { type: String, default: null },
    fitUpTo: { type: String, default: null },
    registrationDate: { type: Date, default: null },
    ownerName: { type: String, default: null },
    fatherName: { type: String, default: null },
    presentAddress: { type: String, default: null },
    permanentAddress: { type: String, default: null },
    makerDescription: { type: String, default: null },
    makerModel: { type: String, default: null },
    fuelType: { type: String, default: null },
    color: { type: String, default: null },
    registeredAt: { type: String, default: null },

    // Vehicle insurance
    insuranceImg: { type: String, default: null },
    insuranceVerification: {
      type: String,
      enum: ["initial", "pending", "rejected", "verified"],
      default: "initial",
    },

    // Vehicle images
    vehicleFrontImage: { type: String, default: null },
    vehicleBackImage: { type: String, default: null },
    vehicleRightImage: { type: String, default: null },
    vehicleLeftImage: { type: String, default: null },
    vehicleNumberPlate: { type: String, default: null },
    vehicleHelmetImage: { type: String, default: null },

    vehicleImageVerification: {
      type: String,
      enum: ["initial", "pending", "rejected", "verified"],
      default: "initial",
    },

    fitnessCer: { type: String, default: null },
  },
  { _id: false }
);
