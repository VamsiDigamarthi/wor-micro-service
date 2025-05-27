// models/UserModel.js
import mongoose from "mongoose";
import { aadharCardDetailsSchema } from "../mongoose-schemas/aadharcard-schema.js";
import { serviceSchema } from "../mongoose-schemas/service-schema.js";
import { licenseCardDetailsSchema } from "../mongoose-schemas/licensecard-schema.js";
import {
  bankDetailsSchema,
  emergencyContactSchema,
} from "../mongoose-schemas/bankdetails-schema.js";

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  mpin: { type: String, default: null },
  email: { type: String },
  dateOfBirth: { type: String },
  address: { type: String },
  fbtoken: { type: String },
  fbinstallationId: { type: String },
  languages: { type: [String], default: [] },
  role: { type: String, enum: ["user", "captain"], default: "user" },
  onDuty: { type: Boolean, default: false },
  profilePic: { type: String },
  captainLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number] },
  },
  deviceId: { type: String, required: true, default: null },
  referalCode: { type: String, default: null },

  // account deletion
  accountDeleteStatus: {
    type: String,
    enum: ["active", "pending", "terminated"],
    default: "active",
  },
  deletionReason: { type: String, default: null },
  accountDeleteRequestDate: { type: Date, default: null },

  manuallyRegister: { type: Boolean, default: false },

  // aadhar
  aadharCardDetails: {
    type: aadharCardDetailsSchema,
    default: null,
  },
  aadharCarVerificaation: { type: Boolean, default: null },

  // license
  licenseCardDetails: {
    type: licenseCardDetailsSchema,
    default: null,
  },

  // pan
  panCardDetails: {
    type: {
      pan: { type: String, default: null },
      name: { type: String, default: null },
    },
    default: null,
  },

  services: {
    type: [serviceSchema],
    default: [],
  },

  activeService: {
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

  emergencyContact: { type: [emergencyContactSchema], default: [] },
  bankDetails: { type: [bankDetailsSchema], default: [] },
});

userSchema.index({ captainLocation: "2dsphere" });

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
