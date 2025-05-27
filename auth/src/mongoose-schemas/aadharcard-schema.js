import mongoose from "mongoose";
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    country: { type: String },
    dist: { type: String },
    state: { type: String },
    mandal: { type: String },
    village: { type: String },
    house: { type: String },
  },
  { _id: false }
);

export const aadharCardDetailsSchema = new Schema(
  {
    fullName: { type: String },
    dob: { type: String },
    gender: { type: String },
    aadhaarNumber: { type: String },
    careOf: { type: String },
    aadharImage: { type: String },
    address: {
      type: addressSchema,
      default: null,
    },
  },
  { _id: false }
);
