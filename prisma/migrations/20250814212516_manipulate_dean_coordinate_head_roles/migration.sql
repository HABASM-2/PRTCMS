-- AlterTable
ALTER TABLE "public"."ProposalNotice" ADD COLUMN     "forwards" JSONB;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "coordinatorForDepartments" JSONB;
