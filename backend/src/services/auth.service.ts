import { findUserByEmail, findUserById, insertUser } from "../repositories/users.repository.ts";
import type { LoginInput, RegisterInput } from "../types/auth.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { signToken } from "../utils/token.ts";

function toSessionUser(user: { id: string; name: string; email: string; slug: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    slug: user.slug,
  };
}

export async function registerService(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("Email already registered.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await insertUser({
    ...input,
    passwordHash,
  });

  return {
    user: toSessionUser(user),
    token: signToken(user),
  };
}

export async function loginService(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user?.passwordHash) {
    throw new Error("Invalid credentials.");
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Invalid credentials.");
  }

  return {
    user: toSessionUser(user),
    token: signToken(user),
  };
}

export async function meService(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return toSessionUser(user);
}
