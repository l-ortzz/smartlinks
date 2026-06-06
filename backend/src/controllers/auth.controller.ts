import type { FastifyReply, FastifyRequest } from "fastify";
import { loginService, meService, registerService } from "../services/auth.service.ts";
import type { LoginInput, RegisterInput } from "../types/auth.ts";

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  try {
    const session = await registerService(request.body);
    return reply.status(201).send(session);
  } catch (error) {
    return reply.status(409).send({
      message: error instanceof Error ? error.message : "Could not register user.",
    });
  }
}

export async function login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
  try {
    const session = await loginService(request.body);
    return reply.send(session);
  } catch {
    return reply.status(401).send({
      message: "Invalid credentials.",
    });
  }
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Authentication required.",
    });
  }

  const user = await meService(request.user.id);
  return reply.send(user);
}
