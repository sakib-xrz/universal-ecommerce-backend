-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "delivery_charge_inside_dhaka" DOUBLE PRECISION NOT NULL DEFAULT 70,
ADD COLUMN     "delivery_charge_outside_dhaka" DOUBLE PRECISION NOT NULL DEFAULT 130;
