export const sendResponse = (
  res,
  statusCode,
  message,
  error = null,
  extra = {}
) => {
  const payload = { message };

  if (error) {
    payload.error = error.message || error;
  }

  Object.assign(payload, extra);

  return res.status(statusCode).json(payload);
};
