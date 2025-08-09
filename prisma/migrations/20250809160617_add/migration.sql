-- CreateTable
CREATE TABLE "public"."FinalDecision" (
    "id" SERIAL NOT NULL,
    "submitProposalId" INTEGER NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL,
    "reason" TEXT,
    "decidedById" INTEGER NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinalDecision_submitProposalId_key" ON "public"."FinalDecision"("submitProposalId");

-- AddForeignKey
ALTER TABLE "public"."FinalDecision" ADD CONSTRAINT "FinalDecision_submitProposalId_fkey" FOREIGN KEY ("submitProposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinalDecision" ADD CONSTRAINT "FinalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
