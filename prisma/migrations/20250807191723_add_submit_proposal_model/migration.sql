-- CreateTable
CREATE TABLE "public"."SubmitProposal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "participants" TEXT[],
    "fileUrl" TEXT,
    "submittedById" INTEGER NOT NULL,
    "orgUnitId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmitProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmitProposal_submittedById_idx" ON "public"."SubmitProposal"("submittedById");

-- CreateIndex
CREATE INDEX "SubmitProposal_orgUnitId_idx" ON "public"."SubmitProposal"("orgUnitId");

-- AddForeignKey
ALTER TABLE "public"."SubmitProposal" ADD CONSTRAINT "SubmitProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmitProposal" ADD CONSTRAINT "SubmitProposal_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
