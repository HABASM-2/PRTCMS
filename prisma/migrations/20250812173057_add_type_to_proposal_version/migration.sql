-- AlterTable
ALTER TABLE "public"."ProposalVersion" ADD COLUMN     "type" "public"."NoticeType" NOT NULL DEFAULT 'CONCEPT_NOTE';
