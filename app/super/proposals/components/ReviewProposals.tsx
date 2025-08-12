"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StopCircle } from "lucide-react";

type ReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_MODIFICATION";
import ReviewModal from "./ReviewModal";

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
  resubmitAllowed: boolean;
}

interface Proposal {
  id: number;
  title: string;
  submittedBy: string;
  orgUnitName: string;
  createdAt: string;
  versions: ProposalVersion[];
  finalDecision?: FinalDecision | null;
  noticeType?: "JUST_NOTICE" | "CONCEPT_NOTE" | "PROPOSAL" | null; // added noticeType
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
  // const [comments, setComments] = useState("");
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

  // Adding modernised reviews

  // States
  const [comments, setComments] = useState<
    {
      id: number;
      authorId: number;
      authorName: string;
      content: string;
      createdAt: string;
      updatedAt: string | null;
    }[]
  >([]);

  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Identify current ProposalReview id (version + user)
  const currentProposalReview = selectedVersion?.reviews.find(
    (r) => r.reviewerId === userId
  );

  useEffect(() => {
    async function loadComments() {
      if (!currentProposalReview) {
        setComments([]);
        return;
      }
      const res = await fetch(
        `/api/proposals/review-comments?proposalReviewId=${currentProposalReview.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    }
    loadComments();
  }, [currentProposalReview?.id]);

  async function handleAddComment() {
    if (!newComment.trim() || !currentProposalReview) return;
    const res = await fetch(`/api/proposals/review-comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalReviewId: currentProposalReview.id,
        authorId: userId,
        content: newComment.trim(),
      }),
    });
    if (res.ok) {
      setNewComment("");
      const data = await (
        await fetch(
          `/api/proposals/review-comments?proposalReviewId=${currentProposalReview.id}`
        )
      ).json();
      setComments(data.comments);
    }
  }

  async function handleEditComment() {
    if (!editingContent.trim() || editingCommentId === null) return;

    const res = await fetch(
      `/api/proposals/review-comments/${editingCommentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editingContent.trim(),
          authorId: userId,
        }),
      }
    );
    if (res.ok) {
      setEditingCommentId(null);
      setEditingContent("");
      const data = await (
        await fetch(
          `/api/proposals/review-comments?proposalReviewId=${
            currentProposalReview!.id
          }`
        )
      ).json();
      setComments(data.comments);
    }
  }

  async function handleDeleteComment(id: number) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const res = await fetch(`/api/proposals/review-comments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: userId }),
    });
    if (res.ok) {
      const data = await (
        await fetch(
          `/api/proposals/review-comments?proposalReviewId=${
            currentProposalReview!.id
          }`
        )
      ).json();
      setComments(data.comments);
    }
  }

  async function fetchProposals() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proposals/reviews?userId=${userId}&page=${page}&pageSize=${pageSize}&filter=${encodeURIComponent(
          filter
        )}`
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
      // setComments(userReview?.comments || "");
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
    // setComments(userReview?.comments || "");
    setFile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  function removeExistingReviewTypeSentence(
    comment: string,
    noticeTypeLabel: string
  ) {
    // Regex to remove line like: "This review pertains to a Concept Note."
    const pattern = new RegExp(
      `^\\s*\\(?This review pertains to a ${noticeTypeLabel}\\.\\)?\\s*\\n?`,
      "i"
    );
    return comment.replace(pattern, "").trim();
  }

  async function handleSubmitReview() {
    if (!selectedProposal || !selectedVersionId) return;

    try {
      setLoading(true);

      const noticeTypeLabel = getNoticeTypeLabel(selectedProposal.noticeType);

      // Clean existing sentence if present
      let cleanedComments = comments
        ? removeExistingReviewTypeSentence("comments", noticeTypeLabel)
        : "";

      // Compose enhanced comments with the sentence prepended
      const enhancedComments = cleanedComments
        ? `This review pertains to a ${noticeTypeLabel}.\n${cleanedComments}`
        : `This review pertains to a ${noticeTypeLabel}.`;

      const res = await fetch("/api/proposals/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalVersionId: selectedVersionId,
          reviewerId: userId,
          status: reviewStatus,
          comments: enhancedComments,
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

  // Helper to convert noticeType enum to readable label
  function getNoticeTypeLabel(type: string | undefined | null) {
    switch (type) {
      case "JUST_NOTICE":
        return "Notice";
      case "CONCEPT_NOTE":
        return "Concept Note";
      case "PROPOSAL":
        return "Proposal";
      default:
        return "Unknown";
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
      <ReviewModal
        open={open}
        setOpen={setOpen}
        selectedProposal={selectedProposal as any}
        selectedVersionId={selectedVersionId}
        onVersionChange={onVersionChange}
        existingReview={existingReview}
        userId={userId}
        reviewStatus={reviewStatus}
        setReviewStatus={setReviewStatus}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editingContent={editingContent}
        setEditingContent={setEditingContent}
        file={file}
        setFile={setFile}
        loading={loading}
        isFinalized={isFinalized}
        getNoticeTypeLabel={getNoticeTypeLabel}
        getStatusBadgeClasses={getStatusBadgeClasses}
        handleAddComment={handleAddComment}
        handleEditComment={handleEditComment}
        handleDeleteComment={handleDeleteComment}
        handleFileChange={handleFileChange}
        handleSubmitReview={handleSubmitReview}
        resubmitAllowed={selectedVersion?.resubmitAllowed ?? false}
      />
    </div>
  );
}
