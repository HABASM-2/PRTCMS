/*
  Warnings:

  - A unique constraint covering the columns `[submittedById,noticeId]` on the table `SubmitProposal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `noticeId` to the `SubmitProposal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SubmitProposal" ADD COLUMN     "noticeId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "SubmitProposal_noticeId_idx" ON "public"."SubmitProposal"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmitProposal_submittedById_noticeId_key" ON "public"."SubmitProposal"("submittedById", "noticeId");

-- AddForeignKey
ALTER TABLE "public"."SubmitProposal" ADD CONSTRAINT "SubmitProposal_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "public"."ProposalNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
