/*
  Warnings:

  - You are about to drop the column `item_description` on the `swop_agreement` table. All the data in the column will be lost.
  - You are about to drop the column `item_title` on the `swop_agreement` table. All the data in the column will be lost.
  - Added the required column `agreement_title` to the `swop_agreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skills` to the `swop_agreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeline_days` to the `swop_agreement` table without a default value. This is not possible if the table is not empty.
  - Made the column `terms` on table `swop_agreement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."swop_agreement" DROP COLUMN "item_description",
DROP COLUMN "item_title",
ADD COLUMN     "agreement_title" TEXT NOT NULL,
ADD COLUMN     "agreement_type" TEXT NOT NULL DEFAULT 'skill_swap',
ADD COLUMN     "communication_method" TEXT,
ADD COLUMN     "confidentiality" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dispute_resolution" TEXT,
ADD COLUMN     "from_user_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meeting_location" TEXT,
ADD COLUMN     "skills" JSONB NOT NULL,
ADD COLUMN     "special_conditions" TEXT,
ADD COLUMN     "termination_clause" TEXT,
ADD COLUMN     "timeline_days" INTEGER NOT NULL,
ADD COLUMN     "to_user_accepted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "agreement_status" SET DEFAULT 'pending',
ALTER COLUMN "terms" SET NOT NULL;
