-- CreateTable
CREATE TABLE "public"."ProposalReviewComment" (
    "id" SERIAL NOT NULL,
    "proposalReviewId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalReviewComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProposalReviewComment" ADD CONSTRAINT "ProposalReviewComment_proposalReviewId_fkey" FOREIGN KEY ("proposalReviewId") REFERENCES "public"."ProposalReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalReviewComment" ADD CONSTRAINT "ProposalReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
