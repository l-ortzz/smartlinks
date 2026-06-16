import type { FastifyReply, FastifyRequest } from "fastify";
import {
  uploadLogoService,
  uploadProductImagesService,
} from "../services/uploads.service.ts";
import type { UploadFileInput } from "../types/uploads.ts";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function badRequest(reply: FastifyReply, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Could not upload image.";

  return reply.status(400).send({
    message,
  });
}

function isFileTooLargeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "FST_REQ_FILE_TOO_LARGE"
  );
}

async function readUploadFile(file: Awaited<ReturnType<FastifyRequest["file"]>>) {
  if (!file) return undefined;

  return {
    filename: file.filename,
    mimetype: file.mimetype,
    buffer: await file.toBuffer(),
  } satisfies UploadFileInput;
}

export async function uploadLogo(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const file = await request.file({
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    });

    const result = await uploadLogoService(await readUploadFile(file));

    return reply.status(201).send(result);
  } catch (error) {
    if (isFileTooLargeError(error)) {
      return reply.status(400).send({
        message: "Image must be 5 MB or smaller.",
      });
    }

    return badRequest(reply, error);
  }
}

export async function uploadProductImages(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const files: UploadFileInput[] = [];

  try {
    for await (const file of request.files({
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    })) {
      if (file.fieldname !== "files[]" && file.fieldname !== "files") {
        continue;
      }

      files.push({
        filename: file.filename,
        mimetype: file.mimetype,
        buffer: await file.toBuffer(),
      });
    }

    const result = await uploadProductImagesService(files);

    return reply.status(201).send(result);
  } catch (error) {
    if (isFileTooLargeError(error)) {
      return reply.status(400).send({
        message: "Each image must be 5 MB or smaller.",
      });
    }

    return badRequest(reply, error);
  }
}
