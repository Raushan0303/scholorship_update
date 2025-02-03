/*
  Warnings:

  - You are about to drop the column `applicationLink` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `caste` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `eligibilityAge` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `qualification` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `religion` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `scholarshipType` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Scholarship` table. All the data in the column will be lost.
  - Added the required column `about` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applyLink` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `benefits` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadline` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documents` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `howToApply` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importantDates` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Scholarship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scholarship" DROP COLUMN "applicationLink",
DROP COLUMN "caste",
DROP COLUMN "createdAt",
DROP COLUMN "eligibilityAge",
DROP COLUMN "name",
DROP COLUMN "qualification",
DROP COLUMN "religion",
DROP COLUMN "scholarshipType",
DROP COLUMN "state",
DROP COLUMN "url",
ADD COLUMN     "about" TEXT NOT NULL,
ADD COLUMN     "applyLink" TEXT NOT NULL,
ADD COLUMN     "benefits" TEXT NOT NULL,
ADD COLUMN     "deadline" TEXT NOT NULL,
ADD COLUMN     "documents" TEXT NOT NULL,
ADD COLUMN     "howToApply" TEXT NOT NULL,
ADD COLUMN     "importantDates" TEXT NOT NULL,
ADD COLUMN     "link" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ScholarshipType";
