/*
  Warnings:

  - You are about to drop the column `size` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsedMB` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "size",
ADD COLUMN     "sizeKB" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "size",
ADD COLUMN     "sizeKB" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "memoryUsedMB",
ADD COLUMN     "memoryUsedKB" BIGINT NOT NULL DEFAULT 0;
