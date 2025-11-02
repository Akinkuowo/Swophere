/*
  Warnings:

  - You are about to drop the column `amount` on the `Swap` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Swap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Swap" DROP COLUMN "amount",
DROP COLUMN "currency",
ADD COLUMN     "interested_swaps" JSONB;
