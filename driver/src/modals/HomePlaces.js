import mongoose from "mongoose";
const { Schema } = mongoose;

const HomePlacesSchema = new Schema(
  {
    placeName: {
      type: String,
      required: true,
    },
    placeVicinity: {
      type: String,
      required: true,
    },
    placeLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  }
  // { timestamps: true }
);

HomePlacesSchema.index({ placeLocation: "2dsphere" });

const HomePlacesModel = mongoose.model("HomePlaces", HomePlacesSchema);
export default HomePlacesModel;
