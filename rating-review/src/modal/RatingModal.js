import mongoose from "mongoose";
const { Schema } = mongoose;

const RatingSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, // Minimum rating is 1
      max: 5, // Maximum rating is 5
      default: 5,
    },
    text: {
      type: String, // Optional text for the rating
      default: "",
    },
  }
  // { timestamps: true }
);

const RatingModel = mongoose.model("Rating", RatingSchema);
export default RatingModel;
