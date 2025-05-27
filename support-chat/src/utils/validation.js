import Joi from "joi";

export const supportCahtValidation = (data) => {
  const schema = Joi.object({
    participants: Joi.array()
      .items(
        Joi.object({
          participantId: objectId().required(),
          participantModel: Joi.string().valid("User", "AdminUsers").required(),
          unreadCount: Joi.number().min(0).optional(),
        })
      )
      .min(2) // Must have at least 2 participants (User and Admin)
      .required(),
  });

  return schema.validate(data);
};
