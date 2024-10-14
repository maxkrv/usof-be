/*
  Warnings:

  - You are about to drop the column `userId` on the `categories` table. All the data in the column will be lost.
  - The `status` column on the `posts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_userId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "status",
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "PostStatus";
