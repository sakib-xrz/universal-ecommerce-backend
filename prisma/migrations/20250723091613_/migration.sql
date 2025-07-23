/*
  Warnings:

  - The values [TERMS_AND_CONDITIONS] on the enum `StaticPageKind` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StaticPageKind_new" AS ENUM ('ABOUT_US', 'PRIVACY_POLICY', 'SHIPPING_INFORMATION');
ALTER TABLE "static_pages" ALTER COLUMN "kind" TYPE "StaticPageKind_new" USING ("kind"::text::"StaticPageKind_new");
ALTER TYPE "StaticPageKind" RENAME TO "StaticPageKind_old";
ALTER TYPE "StaticPageKind_new" RENAME TO "StaticPageKind";
DROP TYPE "StaticPageKind_old";
COMMIT;
