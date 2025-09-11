/*
  Warnings:

  - You are about to drop the column `company_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_company_id_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "company_id";

-- DropTable
DROP TABLE "public"."Company";
