-- AlterTable
ALTER TABLE "public"."CommitteeMessage" ADD COLUMN     "proposalId" INTEGER;

-- CreateIndex
CREATE INDEX "CommitteeMessage_proposalId_idx" ON "public"."CommitteeMessage"("proposalId");
