/*
  Warnings:

  - A unique constraint covering the columns `[proposalVersionId,reviewerId]` on the table `ProposalReview` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProposalReview_proposalVersionId_reviewerId_key" ON "public"."ProposalReview"("proposalVersionId", "reviewerId");
