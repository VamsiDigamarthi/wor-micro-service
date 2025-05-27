import HomePlacesModel from "../modals/HomePlaces.js";

export const createHomePlaces = async (payload) => {
  const homePlace = new HomePlacesModel(payload);
  await homePlace.save();
  return homePlace;
};
