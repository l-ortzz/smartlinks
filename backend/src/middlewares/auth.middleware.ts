import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../utils/token.ts";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyToken(token);

    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    return reply.status(401).send({
      message: "Invalid or expired token.",
    });
  }
}
