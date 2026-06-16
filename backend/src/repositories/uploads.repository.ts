import { cloudinary } from "../lib/cloudinary.ts";
import type { UploadFolder } from "../types/uploads.ts";

function getCloudinaryErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    const nestedError = error.error;

    if (
      typeof nestedError === "object" &&
      nestedError !== null &&
      "message" in nestedError &&
      typeof nestedError.message === "string" &&
      nestedError.message
    ) {
      return nestedError.message;
    }

    if (
      typeof nestedError === "object" &&
      nestedError !== null &&
      "code" in nestedError &&
      typeof nestedError.code === "string" &&
      nestedError.code
    ) {
      return `Cloudinary upload failed: ${nestedError.code}.`;
    }
  }

  return "Could not upload image.";
}

export async function uploadImageRepository(
  buffer: Buffer,
  mimetype: string,
  folder: UploadFolder,
): Promise<string> {
  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });

    if (!result.secure_url) {
      throw new Error("Could not upload image.");
    }

    return result.secure_url;
  } catch (error) {
    throw new Error(getCloudinaryErrorMessage(error));
  }
}
