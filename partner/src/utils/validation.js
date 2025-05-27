import Joi from "joi";

export const validateNewHomePlace = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": `"Place name" must be a string`,
      "string.empty": `"Place name" is required`,
      "any.required": `"Place name" is required`,
    }),
    vicinity: Joi.string().required().messages({
      "string.base": `"Vicinity" must be a string`,
      "string.empty": `"Vicinity" is required`,
      "any.required": `"Vicinity" is required`,
    }),
    location: Joi.object({
      lat: Joi.number().required().messages({
        "number.base": `"Latitude" must be a number`,
        "any.required": `"Latitude" is required`,
      }),
      lng: Joi.number().required().messages({
        "number.base": `"Longitude" must be a number`,
        "any.required": `"Longitude" is required`,
      }),
    })
      .required()
      .messages({
        "object.base": `"Location" must be an object`,
        "any.required": `"Location" is required`,
      }),
    type: Joi.string().required().messages({
      "string.base": `"Place type" must be a string`,
      "string.empty": `"Place type" is required`,
      "any.required": `"Place type" is required`,
    }),
    head: Joi.string().hex().length(24).optional().messages({
      "string.hex": `"Head ID" must be a valid ObjectId`,
      "string.length": `"Head ID" must be 24 characters`,
    }),
  });

  return schema.validate(data, { abortEarly: true });
};
