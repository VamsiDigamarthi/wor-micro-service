import mongoose from "mongoose";
const { Schema } = mongoose;

const RideChatSchema = new Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  messages: [
    {
      sender: String,
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const RideChatModel = mongoose.model("RideChat", RideChatSchema);
export default RideChatModel;
