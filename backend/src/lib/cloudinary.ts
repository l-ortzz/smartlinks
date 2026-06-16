import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to configure Cloudinary.`);
  }

  return value;
}

cloudinary.config({
  cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
  api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

export { cloudinary };
