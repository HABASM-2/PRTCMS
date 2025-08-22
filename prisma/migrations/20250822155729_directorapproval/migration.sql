-- CreateTable
CREATE TABLE "public"."DirectorApproval" (
    "id" SERIAL NOT NULL,
    "submitProposalId" INTEGER NOT NULL,
    "directorId" INTEGER NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "considerations" TEXT,
    "signedFileUrl" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectorApproval_submitProposalId_idx" ON "public"."DirectorApproval"("submitProposalId");

-- CreateIndex
CREATE INDEX "DirectorApproval_directorId_idx" ON "public"."DirectorApproval"("directorId");

-- AddForeignKey
ALTER TABLE "public"."DirectorApproval" ADD CONSTRAINT "DirectorApproval_submitProposalId_fkey" FOREIGN KEY ("submitProposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DirectorApproval" ADD CONSTRAINT "DirectorApproval_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
