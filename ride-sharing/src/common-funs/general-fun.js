export const getDistanceRange = (attempt) => {
  if (attempt === 0) return { minDistance: 0, maxDistance: 3 };
  if (attempt === 1) return { minDistance: 0, maxDistance: 5 };
  return { minDistance: 0, maxDistance: 6 };
};
