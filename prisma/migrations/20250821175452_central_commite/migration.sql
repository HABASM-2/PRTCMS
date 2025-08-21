-- CreateTable
CREATE TABLE "public"."CentralCommittee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisationId" INTEGER,

    CONSTRAINT "CentralCommittee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CentralCommitteeMember" (
    "committeeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CentralCommitteeMember_pkey" PRIMARY KEY ("committeeId","userId")
);

-- CreateTable
CREATE TABLE "public"."CommitteeDecision" (
    "id" SERIAL NOT NULL,
    "committeeId" INTEGER NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "decidedById" INTEGER NOT NULL,
    "decision" "public"."ReviewStatus" NOT NULL,
    "remarks" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommitteeMessage" (
    "id" SERIAL NOT NULL,
    "committeeId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommitteeDecision_committeeId_idx" ON "public"."CommitteeDecision"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeDecision_proposalId_idx" ON "public"."CommitteeDecision"("proposalId");

-- CreateIndex
CREATE INDEX "CommitteeMessage_committeeId_idx" ON "public"."CommitteeMessage"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMessage_senderId_idx" ON "public"."CommitteeMessage"("senderId");

-- AddForeignKey
ALTER TABLE "public"."CentralCommittee" ADD CONSTRAINT "CentralCommittee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CentralCommittee" ADD CONSTRAINT "CentralCommittee_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CentralCommitteeMember" ADD CONSTRAINT "CentralCommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "public"."CentralCommittee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CentralCommitteeMember" ADD CONSTRAINT "CentralCommitteeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeDecision" ADD CONSTRAINT "CommitteeDecision_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "public"."CentralCommittee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeDecision" ADD CONSTRAINT "CommitteeDecision_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."SubmitProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeDecision" ADD CONSTRAINT "CommitteeDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMessage" ADD CONSTRAINT "CommitteeMessage_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "public"."CentralCommittee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommitteeMessage" ADD CONSTRAINT "CommitteeMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
