-- CreateTable
CREATE TABLE "public"."ProposalForwarding" (
    "id" SERIAL NOT NULL,
    "submitProposalId" INTEGER NOT NULL,
    "forwardedById" INTEGER NOT NULL,
    "forwardedToOrgUnitId" INTEGER NOT NULL,
    "forwardedToRoleId" INTEGER NOT NULL,
    "forwardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,

    CONSTRAINT "ProposalForwarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalForwarding_submitProposalId_idx" ON "public"."ProposalForwarding"("submitProposalId");

-- CreateIndex
CREATE INDEX "ProposalForwarding_forwardedById_idx" ON "public"."ProposalForwarding"("forwardedById");

-- CreateIndex
CREATE INDEX "ProposalForwarding_forwardedToOrgUnitId_idx" ON "public"."ProposalForwarding"("forwardedToOrgUnitId");

-- CreateIndex
CREATE INDEX "ProposalForwarding_forwardedToRoleId_idx" ON "public"."ProposalForwarding"("forwardedToRoleId");

-- AddForeignKey
ALTER TABLE "public"."ProposalForwarding" ADD CONSTRAINT "ProposalForwarding_submitProposalId_fkey" FOREIGN KEY ("submitProposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalForwarding" ADD CONSTRAINT "ProposalForwarding_forwardedById_fkey" FOREIGN KEY ("forwardedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalForwarding" ADD CONSTRAINT "ProposalForwarding_forwardedToOrgUnitId_fkey" FOREIGN KEY ("forwardedToOrgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalForwarding" ADD CONSTRAINT "ProposalForwarding_forwardedToRoleId_fkey" FOREIGN KEY ("forwardedToRoleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
