import { uploadImageRepository } from "../repositories/uploads.repository.ts";
import type { UploadFileInput, UploadFolder } from "../types/uploads.ts";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_PRODUCT_IMAGES = 5;

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function validateImage(file: UploadFileInput) {
  const extension = getExtension(file.filename);

  if (
    !ALLOWED_EXTENSIONS.has(extension) ||
    !ALLOWED_MIME_TYPES.has(file.mimetype)
  ) {
    throw new Error("Invalid image type. Use jpg, jpeg, png or webp.");
  }
}

async function uploadImage(file: UploadFileInput, folder: UploadFolder) {
  validateImage(file);

  const url = await uploadImageRepository(file.buffer, file.mimetype, folder);

  return { url };
}

export async function uploadLogoService(file?: UploadFileInput) {
  if (!file) {
    throw new Error("Logo image is required.");
  }

  return uploadImage(file, "smart-links/logos");
}

export async function uploadProductImagesService(files: UploadFileInput[]) {
  if (files.length < 1) {
    throw new Error("At least one product image is required.");
  }

  if (files.length > MAX_PRODUCT_IMAGES) {
    throw new Error("You can upload up to 5 product images.");
  }

  const images = await Promise.all(
    files.map((file) => uploadImage(file, "smart-links/products")),
  );

  return {
    urls: images.map((image) => image.url),
  };
}
