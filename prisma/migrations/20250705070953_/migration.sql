/*
  Warnings:

  - A unique constraint covering the columns `[category_id]` on the table `featured_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "featured_categories" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sort_order" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "featured_categories_category_id_key" ON "featured_categories"("category_id");
