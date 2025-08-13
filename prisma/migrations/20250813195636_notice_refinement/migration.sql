-- DropForeignKey
ALTER TABLE "public"."ProposalNotice" DROP CONSTRAINT "ProposalNotice_orgUnitId_fkey";

-- CreateTable
CREATE TABLE "public"."ProposalNoticeOrgUnit" (
    "proposalNoticeId" INTEGER NOT NULL,
    "orgUnitId" INTEGER NOT NULL,

    CONSTRAINT "ProposalNoticeOrgUnit_pkey" PRIMARY KEY ("proposalNoticeId","orgUnitId")
);

-- AddForeignKey
ALTER TABLE "public"."ProposalNotice" ADD CONSTRAINT "ProposalNotice_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeOrgUnit" ADD CONSTRAINT "ProposalNoticeOrgUnit_proposalNoticeId_fkey" FOREIGN KEY ("proposalNoticeId") REFERENCES "public"."ProposalNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalNoticeOrgUnit" ADD CONSTRAINT "ProposalNoticeOrgUnit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
