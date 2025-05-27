import mongoose from "mongoose";

const { Schema } = mongoose;

export const bankDetailsSchema = new Schema({
  paymnetBank: {
    type: String,
    enum: ["bank", "upi"],
    default: "bank",
  },
  holderName: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },
});

export const emergencyContactSchema = new Schema({
  name: { type: String },
  mobile: { type: String },
  option: {
    type: String,
    enum: [
      "All rides shared automatically",
      "Night ride shared automatically (9PM - 6AM)",
      "I will shared rides manually",
    ],
  },
});
