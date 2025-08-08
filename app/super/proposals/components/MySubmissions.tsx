"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ResubmitProposalForm from "./ResubmitProposalForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Review {
  id: number;
  reviewerName: string;
  status: string;
  comments?: string;
  createdAt: string;
}

interface Version {
  versionNumber: number;
  reviews: Review[];
  description?: string;
  participants: string[];
  title: string;
  fileUrl?: string | null;
}

interface Submission {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  versions: Version[];
}

interface Props {
  userId: number;
}

export default function MySubmissions({ userId }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [resubmittingSubmission, setResubmittingSubmission] =
    useState<Submission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(
    null
  );

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/submissions?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      setSubmissions(data.submissions);
    } catch (error) {
      setSubmissions([]);
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Show resubmit form with prefilled fields from latest version
  if (resubmittingSubmission) {
    const latestVersion =
      resubmittingSubmission.versions[
        resubmittingSubmission.versions.length - 1
      ];

    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setResubmittingSubmission(null)}
          className="mb-4"
        >
          Back to Submissions
        </Button>

        <ResubmitProposalForm
          submitProposalId={resubmittingSubmission.id}
          initialTitle={latestVersion?.title || resubmittingSubmission.title}
          initialDescription={latestVersion?.description || ""}
          initialParticipants={latestVersion?.participants || []}
          initialFileUrl={latestVersion?.fileUrl || null}
          onSuccess={() => {
            setResubmittingSubmission(null);
            fetchSubmissions();
          }}
          onCancel={() => setResubmittingSubmission(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">My Submissions</h3>
      {loading ? (
        <p>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Updated At</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="p-2">{sub.title}</td>
                  <td className="p-2">{sub.status}</td>
                  <td className="p-2">
                    {new Date(sub.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 space-x-2">
                    <Button size="sm" onClick={() => setViewingSubmission(sub)}>
                      View Details
                    </Button>
                    {sub.status === "REJECTED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const fullSubmission = submissions.find(
                            (s) => s.id === sub.id
                          );
                          setResubmittingSubmission(fullSubmission || null);
                        }}
                      >
                        Resubmit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Details Dialog */}
          <Dialog
            open={!!viewingSubmission}
            onOpenChange={() => setViewingSubmission(null)}
          >
            <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <DialogHeader>
                <DialogTitle>Submission Details</DialogTitle>
                <DialogDescription>
                  Review the status and comments from reviewers.
                </DialogDescription>
              </DialogHeader>

              {viewingSubmission && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {viewingSubmission.title}
                    </h4>
                    <p>
                      <strong>Status:</strong> {viewingSubmission.status}
                    </p>
                    <p>
                      <strong>Last Updated:</strong>{" "}
                      {new Date(viewingSubmission.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-2">
                      Reviewer Comments History:
                    </h5>
                    {viewingSubmission.versions &&
                    viewingSubmission.versions.length > 0 ? (
                      viewingSubmission.versions.map((version) => (
                        <div
                          key={version.versionNumber}
                          className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-900"
                        >
                          <h6 className="font-semibold mb-2">
                            Version {version.versionNumber}
                          </h6>
                          {version.reviews.length > 0 ? (
                            version.reviews.map((review) => (
                              <div
                                key={review.id}
                                className="mb-3 p-3 border rounded bg-white dark:bg-gray-800"
                              >
                                <p>
                                  <strong>Reviewer:</strong>{" "}
                                  {review.reviewerName}
                                </p>
                                <p>
                                  <strong>Status:</strong> {review.status}
                                </p>
                                <p>
                                  <strong>Comments:</strong>{" "}
                                  {review.comments || "No comments"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Reviewed on{" "}
                                  {new Date(review.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p>No reviews for this version.</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No reviewer comments available.</p>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setViewingSubmission(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
