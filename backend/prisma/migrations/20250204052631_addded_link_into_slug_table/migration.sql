/*
  Warnings:

  - Added the required column `link` to the `Slug` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Slug" ADD COLUMN     "link" TEXT NOT NULL;
