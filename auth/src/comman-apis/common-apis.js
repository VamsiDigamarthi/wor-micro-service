import RatingModel from "../modals/RatingModal.js";

export const getUserAverageRating = async (userId) => {
  const result = await RatingModel.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$user",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  return result.length > 0 ? result[0].averageRating : 5.0;
};
