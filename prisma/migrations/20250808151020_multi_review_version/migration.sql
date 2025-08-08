/*
  Warnings:

  - You are about to drop the column `proposalId` on the `ProposalReview` table. All the data in the column will be lost.
  - Added the required column `proposalVersionId` to the `ProposalReview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ProposalReview" DROP CONSTRAINT "ProposalReview_proposalId_fkey";

-- DropIndex
DROP INDEX "public"."ProposalReview_proposalId_idx";

-- AlterTable
ALTER TABLE "public"."ProposalReview" DROP COLUMN "proposalId",
ADD COLUMN     "proposalVersionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."ProposalVersion" (
    "id" SERIAL NOT NULL,
    "submitProposalId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "participants" TEXT[],
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalVersion_submitProposalId_idx" ON "public"."ProposalVersion"("submitProposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVersion_submitProposalId_versionNumber_key" ON "public"."ProposalVersion"("submitProposalId", "versionNumber");

-- CreateIndex
CREATE INDEX "ProposalReview_proposalVersionId_idx" ON "public"."ProposalReview"("proposalVersionId");

-- AddForeignKey
ALTER TABLE "public"."ProposalVersion" ADD CONSTRAINT "ProposalVersion_submitProposalId_fkey" FOREIGN KEY ("submitProposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalReview" ADD CONSTRAINT "ProposalReview_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "public"."ProposalVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
