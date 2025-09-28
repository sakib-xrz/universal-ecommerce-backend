/*
  Warnings:

  - The `item_weight` column on the `pathao_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."pathao_orders" DROP COLUMN "item_weight",
ADD COLUMN     "item_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
