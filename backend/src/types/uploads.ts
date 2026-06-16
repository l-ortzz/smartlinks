export type UploadFolder = "smart-links/logos" | "smart-links/products";

export type UploadFileInput = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};
