import mongoose from "mongoose";

const FbTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One token per user (optional: remove if multiple devices per user)
    },
    mobile: {
      type: String,
      required: true,
    },
    fbToken: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const FbToken = mongoose.model("FbToken", FbTokenSchema);

export default FbToken;
