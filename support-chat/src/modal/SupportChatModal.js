import mongoose from "mongoose";
const { Schema } = mongoose;

const SupportChatSchema = new Schema(
  {
    participants: [
      {
        participantId: { type: mongoose.Schema.Types.ObjectId, required: true },
        participantModel: {
          type: String,
          enum: ["User", "AdminUsers"],
        },
        unreadCount: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SupportChatModel = mongoose.model("SupportChat", SupportChatSchema);
export default SupportChatModel;
