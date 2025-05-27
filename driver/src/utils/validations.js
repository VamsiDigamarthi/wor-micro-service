import Joi from "joi";
import mongoose from "mongoose";

// Helper to validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

const homePlaceValidationSchema = (data) => {
  const schema = Joi.object({
    placeName: Joi.string().required().messages({
      "string.empty": "placeName is required",
    }),

    placeVicinity: Joi.string().required().messages({
      "string.empty": "placeVicinity is required",
    }),

    placeLocation: Joi.object({
      type: Joi.string()
        .valid("Point")
        .required()
        .messages({ "any.only": 'placeLocation.type must be "Point"' }),
      coordinates: Joi.array()
        .items(Joi.number().required())
        .length(2)
        .required()
        .messages({
          "array.length":
            "placeLocation.coordinates must have exactly two numbers",
        }),
    }).required(),

    isSelected: Joi.boolean().default(false),

    head: Joi.string().custom(objectId).required().messages({
      "any.required": "head (user ID) is required",
    }),
  });
  return schema.validate(data, { abortEarly: true });
};

export default homePlaceValidationSchema;
