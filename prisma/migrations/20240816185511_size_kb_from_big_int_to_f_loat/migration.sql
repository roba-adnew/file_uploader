-- AlterTable
ALTER TABLE "File" ALTER COLUMN "sizeKB" SET DEFAULT 0,
ALTER COLUMN "sizeKB" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "sizeKB" SET DEFAULT 0,
ALTER COLUMN "sizeKB" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "memoryUsedKB" SET DEFAULT 0,
ALTER COLUMN "memoryUsedKB" SET DATA TYPE DOUBLE PRECISION;