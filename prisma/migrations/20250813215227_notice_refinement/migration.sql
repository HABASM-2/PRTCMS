/*
  Warnings:

  - You are about to drop the column `orgUnitId` on the `ProposalNotice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProposalNotice" DROP CONSTRAINT "ProposalNotice_orgUnitId_fkey";

-- DropIndex
DROP INDEX "public"."ProposalNotice_orgUnitId_idx";

-- AlterTable
ALTER TABLE "public"."ProposalNotice" DROP COLUMN "orgUnitId";
