import mongoose from "mongoose";
const { Schema } = mongoose;

const AdminUsersSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  dob: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [
      "superadmin",
      "admin",
      "support",
      "monitoring",
      "verificationTeam",
      "manager",
    ],
    default: "Manager",
  },
  head: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: "AdminUsers",
    type: String,
  },
  whichType: {
    type: String,
    enum: ["user", "captain"],
    default: "user",
  },
  passKey: {
    type: String,
    default: "wor",
  },
});

const AdminUsersModel = mongoose.model("AdminUsers", AdminUsersSchema);
export default AdminUsersModel;
