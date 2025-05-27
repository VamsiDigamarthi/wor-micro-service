import mongoose from "mongoose";
const { Schema } = mongoose;

const OnDutyCaptainSchema = new Schema({
  captainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  fbtoken: { type: String },
  mobile: { type: String },
  location: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number] },
  },
  activeService: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

OnDutyCaptainSchema.index({ location: "2dsphere" });

const OnDutyCaptain = mongoose.model("OnDutyCaptain", OnDutyCaptainSchema);
export default OnDutyCaptain;
