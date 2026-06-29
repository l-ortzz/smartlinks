import {
  findSelectedModuleByUserId,
  updateSelectedModuleByUserId,
} from "../repositories/module.repository.ts";
import type { ModuleType } from "../../generated/prisma/client.ts";

export async function getSelectedModuleService(userId: string) {
  const selectedModule = await findSelectedModuleByUserId(userId);
  return { selectedModule };
}

export async function updateSelectedModuleService(
  userId: string,
  module: ModuleType,
) {
  const user = await updateSelectedModuleByUserId(userId, module);
  return { selectedModule: user.selectedModule };
}
