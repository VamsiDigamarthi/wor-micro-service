import crypto from "crypto";
export const generateReferralCode = (userId) => {
  return crypto
    .createHash("sha256")
    .update(userId?.toString()) // ✅ Convert ObjectId to string
    .digest("hex")
    .substring(0, 8);
};
