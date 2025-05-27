import moment from "moment-timezone";
export const getFormattedDateTime = () => {
  const indiaDateTime = moment().tz("Asia/Kolkata");

  const formattedDate = indiaDateTime.format("DD-MM-YYYY");

  let formattedTime = indiaDateTime.format("h:mm:ss A");
  formattedTime = formattedTime.toLowerCase();

  return { formattedDate, formattedTime };
};
