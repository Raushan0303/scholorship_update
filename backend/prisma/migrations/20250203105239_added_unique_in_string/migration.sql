/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `Scholarship` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_link_key" ON "Scholarship"("link");
