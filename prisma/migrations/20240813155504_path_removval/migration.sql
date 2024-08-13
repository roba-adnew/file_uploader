/*
  Warnings:

  - You are about to drop the column `path` on the `Folder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Folder_name_path_key";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "path";
