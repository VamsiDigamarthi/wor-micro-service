import mongoose from "mongoose";
const { Schema } = mongoose;

const NewHomePlacesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vicinity: {
    type: String,
    required: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  type: {
    type: String,
    required: true,
  },

  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const NewHomePlacesModel = mongoose.model("NewHomePlaces", NewHomePlacesSchema);
export default NewHomePlacesModel;
