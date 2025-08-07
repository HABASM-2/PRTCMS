-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_MODIFICATION');

-- CreateTable
CREATE TABLE "public"."ProposalReview" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalReview_proposalId_idx" ON "public"."ProposalReview"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalReview_reviewerId_idx" ON "public"."ProposalReview"("reviewerId");

-- AddForeignKey
ALTER TABLE "public"."ProposalReview" ADD CONSTRAINT "ProposalReview_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalReview" ADD CONSTRAINT "ProposalReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
