-- CreateEnum
CREATE TYPE "public"."NoticeType" AS ENUM ('JUST_NOTICE', 'CONCEPT_NOTE', 'PROPOSAL');

-- AlterTable
ALTER TABLE "public"."ProposalNotice" ADD COLUMN     "type" "public"."NoticeType" NOT NULL DEFAULT 'JUST_NOTICE';
