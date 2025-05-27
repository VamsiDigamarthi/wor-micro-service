import Joi from "joi";

export const validateRegisterData = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),

    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/) // Adjust this pattern as per your mobile number format
      .required(),

    email: Joi.string().email().optional().allow(null, ""),

    role: Joi.string().valid("user", "captain").default("user"),

    captainLocation: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).optional(),

    languages: Joi.array().items(Joi.string()).default([]),

    deviceId: Joi.string().allow(null).required(),

    referalCode: Joi.string().allow(null, "").optional(),

    accountDeleteStatus: Joi.string()
      .valid("active", "pending", "terminated")
      .default("active"),

    deletionReason: Joi.string().allow(null, "").optional(),

    accountDeleteRequestDate: Joi.date().optional().allow(null),

    manuallyRegister: Joi.boolean().default(false),
  });

  return schema.validate(data);
};

export const adminRegister = (data) => {
  const schema = Joi.object({
    userName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    userId: Joi.string().required(),
    dob: Joi.string().required(),
    role: Joi.string()
      .valid(
        "superadmin",
        "admin",
        "support",
        "monitoring",
        "verificationTeam",
        "manager"
      )
      .default("manager"),
    head: Joi.string().optional(), // Assuming it's an ObjectId (string format)
    whichType: Joi.string().valid("user", "captain").default("user"),
    passKey: Joi.string().default("wor"),
  });

  return schema.validate(data);
};
