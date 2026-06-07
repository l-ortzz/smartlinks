import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getCompanyPageService,
  getMyProfileService,
  updateUserProfileService,
} from "../services/users.service.ts";

type GetCompanyPageRequest = FastifyRequest<{
  Params: {
    slug: string;
  };
}>;

type UpdateProfileRequest = FastifyRequest<{
  Body: {
    name?: string;
    description?: string;
    logo?: string;
    instagram?: string;
    telefone?: string;
    numeroWhatsApp?: string;
    endereco?: string;
  };
}>;

export async function getCompanyPage(
  request: GetCompanyPageRequest,
  reply: FastifyReply,
) {
  try {
    const company = await getCompanyPageService(request.params.slug);
    return reply.send(company);
  } catch {
    return reply.status(404).send({
      message: "Company page not found.",
    });
  }
}

export async function updateMyProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const user = await updateUserProfileService(
      request.user.id,
      request.body as {
  name?: string;
  description?: string;
  logo?: string;
  instagram?: string;
  telefone?: string;
  numeroWhatsApp?: string;
  endereco?: string;
},
    );

    return reply.send(user);
  } catch (error) {
    return reply.status(400).send({
      message:
        error instanceof Error
          ? error.message
          : "Could not update profile.",
    });
  }
}

export async function getMyProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const profile = await getMyProfileService(request.user.id);
    return reply.send(profile);
  } catch (error) {
    return reply.status(404).send({
      message:
        error instanceof Error
          ? error.message
          : "Profile not found.",
    });
  }
}