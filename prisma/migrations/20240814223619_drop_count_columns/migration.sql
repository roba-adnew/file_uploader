/*
  Warnings:

  - You are about to drop the column `fileCount` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `folderCount` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "fileCount",
DROP COLUMN "folderCount";
