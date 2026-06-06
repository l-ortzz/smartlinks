import type { FastifyReply, FastifyRequest } from "fastify";
import { getCompanyPageService } from "../services/users.service.ts";

type GetCompanyPageRequest = FastifyRequest<{
  Params: {
    slug: string;
  };
}>;

export async function getCompanyPage(request: GetCompanyPageRequest, reply: FastifyReply) {
  try {
    const company = await getCompanyPageService(request.params.slug);
    return reply.send(company);
  } catch {
    return reply.status(404).send({
      message: "Company page not found.",
    });
  }
}
