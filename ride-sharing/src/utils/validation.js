import Joi from "joi";

// GeoJSON Point Schema for pickup/drop
const geoPointSchema = Joi.object({
  type: Joi.string().valid("Point").required(),
  coordinates: Joi.array()
    .items(Joi.number().required()) // [longitude, latitude]
    .length(2)
    .required(),
});

// Create Joi validation schema
const rideValidationSchema = Joi.object({
  price: Joi.string().required(),

  status: Joi.string()
    .valid("pending", "accept", "completed", "cancelled")
    .default("pending"),

  head: Joi.string().hex().length(24).optional(),

  acceptCaptain: Joi.string().hex().length(24).optional(),

  pickupAddress: Joi.string().required(),
  pickupVicinity: Joi.string().optional(),

  dropAddress: Joi.string().required(),
  dropVicinity: Joi.string().optional(),

  pickup: geoPointSchema.required(),
  drop: geoPointSchema.required(),
  deletRequest: Joi.boolean().default(false),

  orderPlaceDate: Joi.string().required(),
  orderPlaceTime: Joi.string().required(),
  socketPlaceTime: Joi.string().required(),
  vehicleType: Joi.string().required(),
  middleDrop: Joi.boolean().default(false),
});

export const validateRide = (rideData) => {
  return rideValidationSchema.validate(rideData);
};
