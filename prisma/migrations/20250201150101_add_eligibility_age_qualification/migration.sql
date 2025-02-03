/*
  Warnings:

  - Added the required column `eligibilityAge` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualification` to the `Scholarship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scholarship" ADD COLUMN     "eligibilityAge" INTEGER NOT NULL,
ADD COLUMN     "qualification" TEXT NOT NULL;
