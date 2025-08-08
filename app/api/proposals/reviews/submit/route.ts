import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, ReviewStatus } from "@prisma/client";

const prisma = new PrismaClient();

type ProposalResponse = {
  id: number;
  title: string;
  submittedBy: string;
  orgUnitName: string;
  status: ReviewStatus | "PENDING";
  createdAt: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Query proposals with latest review status for this reviewer
    const { userId, page = "1", pageSize = "10", filter = "" } = req.query;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const pageNumber = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);

    try {
      // Get total count of proposals (filter applied)
      const totalCount = await prisma.submitProposal.count({
        where: {
          title: {
            contains: filter as string,
            mode: "insensitive",
          },
        },
      });

      // Get proposals with pagination, eager loading latest version & review by this user
      const proposals = await prisma.submitProposal.findMany({
        where: {
          title: {
            contains: filter as string,
            mode: "insensitive",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (pageNumber - 1) * size,
        take: size,
        include: {
          submittedBy: true,
          orgUnit: true,
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1, // latest version only
            include: {
              reviews: {
                where: { reviewerId: Number(userId) },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      // Map to your frontend Proposal type, get status from latest review or default to "PENDING"
      const data: ProposalResponse[] = proposals.map((p) => {
        const latestVersion = p.versions[0];
        const latestReview = latestVersion?.reviews[0];

        return {
          id: p.id,
          title: latestVersion?.title ?? p.title,
          submittedBy: p.submittedBy.fullName,
          orgUnitName: p.orgUnit.name,
          status: latestReview?.status ?? "PENDING",
          createdAt: p.createdAt.toISOString(),
        };
      });

      res.status(200).json({ proposals: data, totalCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch proposals" });
    }
  } else if (req.method === "POST") {
    // Submit a review for a ProposalVersion

    const { proposalId, reviewerId, status, comments } = req.body;

    if (
      typeof proposalId !== "number" ||
      typeof reviewerId !== "number" ||
      !Object.values(ReviewStatus).includes(status) ||
      typeof comments !== "string"
    ) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    try {
      // Find latest ProposalVersion for this proposal
      const latestVersion = await prisma.proposalVersion.findFirst({
        where: { submitProposalId: proposalId },
        orderBy: { versionNumber: "desc" },
      });

      if (!latestVersion) {
        return res.status(404).json({ error: "Proposal version not found" });
      }

      // Create new review
      await prisma.proposalReview.create({
        data: {
          proposalVersionId: latestVersion.id,
          reviewerId,
          status,
          comments,
        },
      });

      res.status(201).json({ message: "Review submitted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
