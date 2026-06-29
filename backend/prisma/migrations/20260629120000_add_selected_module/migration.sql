-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('PAGES', 'AGENDS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "selectedModule" "ModuleType";
