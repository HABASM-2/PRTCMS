/*
  Warnings:

  - You are about to drop the column `forwards` on the `ProposalNotice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ProposalNotice" DROP COLUMN "forwards";

-- CreateTable
CREATE TABLE "public"."ProposalNoticeForward" (
    "proposalNoticeId" INTEGER NOT NULL,
    "orgUnitId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "forwardedById" INTEGER NOT NULL,
    "forwardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalNoticeForward_pkey" PRIMARY KEY ("proposalNoticeId","orgUnitId","userId")
);

-- CreateIndex
CREATE INDEX "ProposalNoticeForward_proposalNoticeId_idx" ON "public"."ProposalNoticeForward"("proposalNoticeId");

-- CreateIndex
CREATE INDEX "ProposalNoticeForward_userId_idx" ON "public"."ProposalNoticeForward"("userId");

-- CreateIndex
CREATE INDEX "ProposalNoticeForward_orgUnitId_idx" ON "public"."ProposalNoticeForward"("orgUnitId");

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeForward" ADD CONSTRAINT "ProposalNoticeForward_proposalNoticeId_fkey" FOREIGN KEY ("proposalNoticeId") REFERENCES "public"."ProposalNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeForward" ADD CONSTRAINT "ProposalNoticeForward_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeForward" ADD CONSTRAINT "ProposalNoticeForward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeForward" ADD CONSTRAINT "ProposalNoticeForward_forwardedById_fkey" FOREIGN KEY ("forwardedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
