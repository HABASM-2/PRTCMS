-- CreateTable
CREATE TABLE "public"."ProposalNotice" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "orgUnitId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalNotice_orgUnitId_idx" ON "public"."ProposalNotice"("orgUnitId");

-- CreateIndex
CREATE INDEX "ProposalNotice_createdById_idx" ON "public"."ProposalNotice"("createdById");

-- AddForeignKey
ALTER TABLE "public"."ProposalNotice" ADD CONSTRAINT "ProposalNotice_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNotice" ADD CONSTRAINT "ProposalNotice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
