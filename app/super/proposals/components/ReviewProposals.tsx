"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { StopCircle } from "lucide-react";

type ReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_MODIFICATION";

interface FinalDecision {
  status: ReviewStatus; // same enum as ReviewStatus
  reason?: string;
  decidedBy: {
    id: number;
    fullName: string;
  };
  decidedAt: string;
}

interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  status: ReviewStatus;
  comments?: string;
  createdAt: string;
}

interface ProposalVersion {
  id: number;
  versionNumber: number;
  title: string;
  description?: string;
  participants: string[]; // added participants
  fileUrl?: string | null; // added fileUrl for attachment
  createdAt: string;
  reviews: Review[];
}

interface Proposal {
  id: number;
  title: string;
  submittedBy: string;
  orgUnitName: string;
  createdAt: string;
  versions: ProposalVersion[];
  finalDecision?: FinalDecision | null;
}

interface Props {
  userId: number;
}

export default function ReviewProposals({ userId }: Props) {
  // States for proposal list and pagination/filter
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal state and selected proposal/version/review
  const [open, setOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null
  );
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("PENDING");
  const [comments, setComments] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Helper to get current version object from selectedVersionId
  const selectedVersion =
    selectedProposal?.versions.find((v) => v.id === selectedVersionId) || null;

  // Find current user's review for selected version if any
  const existingReview =
    selectedVersion?.reviews.find((r) => r.reviewerId === userId) || null;

  const isFinalized =
    selectedProposal?.finalDecision?.status === "ACCEPTED" ||
    selectedProposal?.finalDecision?.status === "REJECTED";

  async function fetchProposals() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proposals/reviews?userId=${userId}&page=${page}&pageSize=${pageSize}&filter=${filter}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProposals(data.proposals);
      setTotalCount(data.totalCount);
    } catch (error) {
      setProposals([]);
      setTotalCount(0);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProposals();
  }, [page, filter]);

  function openReviewModal(proposal: Proposal) {
    setSelectedProposal(proposal);
    if (proposal.versions.length > 0) {
      setSelectedVersionId(proposal.versions[0].id);
      // Reset form with existing review or defaults
      const userReview = proposal.versions[0].reviews.find(
        (r) => r.reviewerId === userId
      );
      setReviewStatus(userReview?.status || "PENDING");
      setComments(userReview?.comments || "");
      setFile(null);
    }
    setOpen(true);
  }

  function onVersionChange(versionId: number) {
    setSelectedVersionId(versionId);
    const version = selectedProposal?.versions.find((v) => v.id === versionId);
    if (!version) return;
    const userReview = version.reviews.find((r) => r.reviewerId === userId);
    setReviewStatus(userReview?.status || "PENDING");
    setComments(userReview?.comments || "");
    setFile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmitReview() {
    if (!selectedProposal || !selectedVersionId) return;

    try {
      setLoading(true);

      // File upload handling omitted for now

      const res = await fetch("/api/proposals/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalVersionId: selectedVersionId,
          reviewerId: userId,
          status: reviewStatus,
          comments,
          // file handling can be added here later
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      alert("Review submitted successfully!");
      setOpen(false);
      fetchProposals();
    } catch (error) {
      alert("Error submitting review");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // Helper for status badge classes
  function getStatusBadgeClasses(status: ReviewStatus) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100";
      case "ACCEPTED":
        return "bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-100";
      case "REJECTED":
        return "bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-100";
      case "NEEDS_MODIFICATION":
        return "bg-blue-200 text-blue-800 dark:bg-blue-600 dark:text-blue-100";
      default:
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  }

  return (
    <div>
      <div className="mb-2">
        <Input
          placeholder="Filter by title"
          value={filter}
          onChange={(e) => {
            setPage(1);
            setFilter(e.target.value);
          }}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="p-2 text-left font-semibold">Title</th>
              <th className="p-2 text-left font-semibold">Submitted By</th>
              <th className="p-2 text-left font-semibold">Org Unit</th>
              <th className="p-2 text-left font-semibold">Versions</th>
              <th className="p-2 text-left font-semibold">Created At</th>
              <th className="p-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  No proposals found.
                </td>
              </tr>
            )}
            {proposals.map((p) => (
              <tr
                key={p.id}
                className="
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  transition-colors duration-200
                "
              >
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.submittedBy}</td>
                <td className="p-2">{p.orgUnitName}</td>
                <td className="p-2">{p.versions.length}</td>
                <td className="p-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReviewModal(p)}
                    aria-label={`Review proposal ${p.title}`}
                  >
                    Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toast(`Action stopped for proposal "${p.title}"`)
                    }
                    aria-label={`Stop action for proposal ${p.title}`}
                  >
                    <StopCircle className="h-5 w-5 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Review Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-0">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>Review Proposal</DialogTitle>
            <DialogDescription>
              Review and update the status, add comments, and optionally upload
              a file.
            </DialogDescription>
          </DialogHeader>

          {/* Wrap entire modal body in ScrollArea with max height */}
          <ScrollArea className="max-h-[600px] px-6 pb-6">
            {selectedProposal && selectedVersion && (
              <>
                {/* Proposal Version Details */}
                <div className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-900">
                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedVersion.title}
                  </h3>

                  {/* Description */}
                  {selectedVersion.description && (
                    <p className="mb-4 whitespace-pre-wrap">
                      {selectedVersion.description}
                    </p>
                  )}

                  {/* Participants */}
                  {selectedVersion.participants &&
                    selectedVersion.participants.length > 0 && (
                      <p className="mb-4">
                        <strong>Participants:</strong>{" "}
                        {selectedVersion.participants.join(", ")}
                      </p>
                    )}

                  {/* Attachment (fileUrl) */}
                  {selectedVersion.fileUrl && (
                    <p className="mb-4">
                      <strong>Attachment:</strong>{" "}
                      <a
                        href={selectedVersion.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        View File
                      </a>
                    </p>
                  )}
                </div>

                {/* Versions selector */}
                <div className="mb-4">
                  <label className="block mb-1 font-medium">
                    Select Version
                  </label>
                  <Select
                    value={selectedVersionId?.toString() || ""}
                    onValueChange={(v) => onVersionChange(parseInt(v))}
                  >
                    <SelectTrigger className="w-full">
                      <span>
                        {selectedVersion
                          ? `v${selectedVersion.versionNumber} - ${new Date(
                              selectedVersion.createdAt
                            ).toLocaleDateString()}`
                          : "Select version"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProposal.versions.map((version) => (
                        <SelectItem
                          key={version.id}
                          value={version.id.toString()}
                        >
                          v{version.versionNumber} -{" "}
                          {new Date(version.createdAt).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Existing Reviews: only current user's review */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Your Review</h4>
                  {!existingReview && (
                    <p className="italic text-gray-500 dark:text-gray-400">
                      You have not reviewed this version yet.
                    </p>
                  )}
                  {existingReview && (
                    <div className="p-3 rounded mb-3 border border-blue-500 bg-blue-50 dark:bg-blue-900">
                      <p>
                        <strong>Reviewer:</strong> {existingReview.reviewerName}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadgeClasses(
                            existingReview.status
                          )}`}
                        >
                          {existingReview.status.replace("_", " ")}
                        </span>
                      </p>
                      <p>
                        <strong>Comments:</strong>{" "}
                        {existingReview.comments || <em>No comments</em>}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reviewed on{" "}
                        {new Date(existingReview.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Review form for current user */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Your Review Status
                    </label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(value) =>
                        setReviewStatus(value as ReviewStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <span>{reviewStatus}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="NEEDS_MODIFICATION">
                          Needs Modification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">
                      Your Comments
                    </label>
                    <Textarea
                      placeholder="Add your comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">
                      Upload File (optional)
                    </label>
                    <input type="file" onChange={handleFileChange} />
                    {file && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>

          <DialogFooter className="mt-4 flex justify-end gap-2 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={loading || isFinalized}
            >
              {loading
                ? "Submitting..."
                : isFinalized
                ? "Reviewed"
                : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
