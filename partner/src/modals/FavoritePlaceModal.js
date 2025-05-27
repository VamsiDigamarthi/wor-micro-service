import mongoose from "mongoose";
const { Schema } = mongoose;

const favoriteSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vicinity: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const FavoriteModel = mongoose.model("Favorite", favoriteSchema);
export default FavoriteModel;
