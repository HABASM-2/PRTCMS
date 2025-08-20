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
import { ScrollArea } from "@/components/ui/scroll-area";

type ReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_MODIFICATION";

interface Comment {
  id: number;
  authorName: string;
  authorId: number;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

interface Version {
  id: number;
  title: string;
  description?: string;
  participants?: string[];
  fileUrl?: string;
  versionNumber: number;
  createdAt: string;
  type: string;
}

interface Proposal {
  id: number;
  noticeType: string;
  versions: Version[];
}

interface Review {
  reviewerName: string;
  status: ReviewStatus;
  createdAt: string;
}

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;

  selectedProposal: Proposal | null;
  selectedVersionId: number | null;
  onVersionChange: (versionId: number) => void;

  existingReview: Review | null;

  userId: number;

  reviewStatus: ReviewStatus;
  setReviewStatus: (status: ReviewStatus) => void;

  comments: Comment[];
  newComment: string;
  setNewComment: (comment: string) => void;

  editingCommentId: number | null;
  setEditingCommentId: (id: number | null) => void;

  editingContent: string;
  setEditingContent: (content: string) => void;

  file: File | null;
  setFile: (file: File | null) => void;

  loading: boolean;
  isFinalized: boolean;
  resubmitAllowed: boolean;

  getNoticeTypeLabel: (noticeType: string) => string;
  getStatusBadgeClasses: (status: ReviewStatus) => string;

  handleAddComment: () => void;
  handleEditComment: () => void;
  handleDeleteComment: (commentId: number) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmitReview: () => void;
}

export default function ReviewModal({
  open,
  setOpen,
  selectedProposal,
  selectedVersionId,
  onVersionChange,
  existingReview,
  userId,
  reviewStatus,
  setReviewStatus,
  comments,
  newComment,
  setNewComment,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  file,
  setFile,
  loading,
  isFinalized,
  getNoticeTypeLabel,
  getStatusBadgeClasses,
  handleAddComment,
  handleEditComment,
  handleDeleteComment,
  handleFileChange,
  handleSubmitReview,
  resubmitAllowed,
}: Props) {
  const selectedVersion =
    selectedProposal?.versions.find((v) => v.id === selectedVersionId) ?? null;
  const lastVersion =
    selectedProposal?.versions[selectedProposal?.versions.length - 1];

  const lastVersionType = lastVersion?.type;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle>Review Proposal</DialogTitle>
          <DialogDescription>
            Review and update the status, add comments, and optionally upload a
            file.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px] px-6 pb-6">
          {selectedProposal && selectedVersion && (
            <>
              {/* Proposal Version Details */}
              <div className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedVersion.title}
                </h3>

                {selectedVersion.description && (
                  <p className="mb-4 whitespace-pre-wrap">
                    {selectedVersion.description}
                  </p>
                )}

                {selectedVersion.participants &&
                  selectedVersion.participants.length > 0 && (
                    <p className="mb-4">
                      <strong>Participants:</strong>{" "}
                      {selectedVersion.participants.join(", ")}
                    </p>
                  )}

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
                <label className="block mb-1 font-medium">Select Version</label>
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

              {/* Existing Reviews */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Your Review</h4>
                {!existingReview && (
                  <p className="italic text-gray-500 dark:text-gray-400">
                    You are going to review:{" "}
                    {getNoticeTypeLabel(selectedVersion?.type)}
                    You have not reviewed this version yet.
                  </p>
                )}
                {existingReview && (
                  <div className="p-3 rounded mb-3 border border-blue-500 bg-blue-50 dark:bg-blue-900">
                    <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300 px-1">
                      Review started as:{" "}
                      {getNoticeTypeLabel(selectedVersion?.type)}
                    </div>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reviewed on{" "}
                      {new Date(existingReview.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Review form */}
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

                {/* Comments Section */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Comments</h4>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-3 bg-gray-50 dark:bg-gray-900">
                    {comments.length === 0 && (
                      <p className="text-sm italic">No comments yet.</p>
                    )}
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded bg-white dark:bg-gray-800 border flex flex-col"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">
                            {c.authorName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(c.createdAt).toLocaleString()}
                            {c.updatedAt ? " (edited)" : ""}
                          </span>
                        </div>

                        {editingCommentId === c.id ? (
                          <>
                            <textarea
                              className="w-full rounded border p-2 mt-3 resize-none"
                              rows={3}
                              placeholder="Edit your comment..."
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              disabled={isFinalized || resubmitAllowed}
                            />
                            <div className="mt-1 space-x-2">
                              <button
                                className="text-blue-600 hover:underline disabled:opacity-50"
                                onClick={handleEditComment}
                                disabled={isFinalized || resubmitAllowed}
                              >
                                Save
                              </button>
                              <button
                                className="text-gray-600 hover:underline"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingContent("");
                                }}
                                disabled={isFinalized || resubmitAllowed}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{c.content}</p>
                            {c.authorId === userId &&
                              !isFinalized &&
                              !resubmitAllowed && (
                                <div className="mt-1 space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditingContent(c.content);
                                    }}
                                    className="hover:underline disabled:opacity-50"
                                    disabled={isFinalized || resubmitAllowed}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="hover:underline text-red-600 disabled:opacity-50"
                                    disabled={isFinalized || resubmitAllowed}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <textarea
                    className="w-full rounded border p-2 mt-3 resize-none"
                    rows={3}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isFinalized || resubmitAllowed}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={
                      isFinalized || resubmitAllowed || !newComment.trim()
                    }
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  >
                    Add Comment
                  </button>
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
            disabled={loading || isFinalized || resubmitAllowed}
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
  );
}
