/*
  Warnings:

  - Added the required column `scholarshipType` to the `Scholarship` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('CENTRAL', 'STATE', 'LOCAL', 'PRIVATE');

-- AlterTable
ALTER TABLE "Scholarship" ADD COLUMN     "scholarshipType" "ScholarshipType" NOT NULL;
