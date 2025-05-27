import AWS from "aws-sdk";
import "dotenv/config";

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT); // Replace with your region
export const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

export const uploadToS3 = async (file, folder = "images") => {
  const params = {
    Bucket: process.env.DO_SPACES_NAME,
    Key: `${folder}/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const result = await s3.upload(params).promise();
  return result.Location; // S3 file URL
};
