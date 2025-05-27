import mongoose from "mongoose";
const { Schema } = mongoose;

const WithdraRequestSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymnetBank: {
      type: String,
      enum: ["bank", "upi"],
      default: "bank",
    },
    holderName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    upiId: { type: String },
    money: { type: String },
    isPayed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const WithdraRequestModel = mongoose.model(
  "WithdraRequest",
  WithdraRequestSchema
);

export default WithdraRequestModel;
