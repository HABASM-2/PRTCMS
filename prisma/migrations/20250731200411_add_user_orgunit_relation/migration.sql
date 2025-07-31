-- CreateTable
CREATE TABLE "public"."UserOrgUnit" (
    "userId" INTEGER NOT NULL,
    "orgUnitId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrgUnit_pkey" PRIMARY KEY ("userId","orgUnitId")
);

-- AddForeignKey
ALTER TABLE "public"."UserOrgUnit" ADD CONSTRAINT "UserOrgUnit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOrgUnit" ADD CONSTRAINT "UserOrgUnit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
