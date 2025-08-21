/*
  Warnings:

  - You are about to drop the column `committeeId` on the `CommitteeMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CommitteeMessage" DROP CONSTRAINT "CommitteeMessage_committeeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommitteeMessage" DROP CONSTRAINT "CommitteeMessage_senderId_fkey";

-- DropIndex
DROP INDEX "public"."CommitteeMessage_committeeId_idx";

-- DropIndex
DROP INDEX "public"."CommitteeMessage_proposalId_idx";

-- DropIndex
DROP INDEX "public"."CommitteeMessage_senderId_idx";

-- AlterTable
ALTER TABLE "public"."CommitteeMessage" DROP COLUMN "committeeId",
ADD COLUMN     "centralCommitteeId" INTEGER,
ALTER COLUMN "senderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMessage" ADD CONSTRAINT "CommitteeMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMessage" ADD CONSTRAINT "CommitteeMessage_centralCommitteeId_fkey" FOREIGN KEY ("centralCommitteeId") REFERENCES "public"."CentralCommittee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
