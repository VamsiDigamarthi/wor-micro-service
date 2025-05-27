import mongoose from "mongoose";

const { Schema } = mongoose;

export const licenseCardDetailsSchema = new Schema({
  licenseNumber: { type: String, default: null },
  state: { type: String, default: null },
  name: { type: String, default: null },
  permanentAddress: { type: String, default: null },
  temporaryAddress: { type: String, default: null },
  dob: { type: String, default: null },
  gender: { type: String, default: null },
  profileImage: { type: String, default: null },
});
