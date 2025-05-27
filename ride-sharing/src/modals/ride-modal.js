import mongoose from "mongoose";
const { Schema } = mongoose;

const RideSchema = new Schema(
  {
    price: {
      type: String,
      required: true,
    },
    extraCharge: { type: Number, default: 0 },
    addTip: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "wallet" },
    status: {
      type: String,
      enum: ["pending", "accept", "completed", "cancelled"],
      default: "pending",
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptCaptain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    mobile: { type: String, default: null },
    captainMobile: { type: String, default: null },
    pickupAddress: { type: String, required: true },
    pickupVicinity: { type: String },
    dropAddress: { type: String, required: true },
    dropVicinity: { type: String },

    pickup: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    drop: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    orderOtp: { type: Number },
    orderOtpVerified: { type: Boolean, default: false },
    isArrived: { type: Boolean, default: false },

    deletRequest: {
      type: Boolean,
      default: false,
    },
    favorite: {
      type: Boolean,
      default: false,
    },

    cancelReason: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: {
        type: String,
      },
      role: {
        type: String,
        enum: ["user", "captain"],
        default: "user",
      },
    },

    // change destination
    newDropLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    newDropAddress: { type: String },
    newDropVicinity: { type: String },
    newDesitionOrderStatus: {
      type: String,
      default: "pending",
    },
    changeDesPrice: { type: Number, default: 0 },
    middleDrop: { type: Boolean, default: false },
    // oder place times
    orderPlaceDate: {
      type: String,
      required: true,
    },
    orderPlaceTime: {
      type: String,
      required: true,
    },
    socketPlaceTime: {
      type: String,
      required: true,
    },
    rejectedCaptaine: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    vehicleType: {
      type: String,
      required: true,
    },
    // distance and price fileds
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    captainCoor: {
      type: [Number],
      default: [],
    },
    distanceFromCaptainToPickUp: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

RideSchema.index({ pickup: "2dsphere" });
RideSchema.index({ drop: "2dsphere" });
RideSchema.index({ newDrop: "2dsphere" });

const OrderModal = mongoose.model("Orders", RideSchema);
export default OrderModal;
