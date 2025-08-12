-- AlterTable
ALTER TABLE "public"."ProposalReviewComment" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ProposalReviewComment_proposalReviewId_idx" ON "public"."ProposalReviewComment"("proposalReviewId");

-- CreateIndex
CREATE INDEX "ProposalReviewComment_authorId_idx" ON "public"."ProposalReviewComment"("authorId");
