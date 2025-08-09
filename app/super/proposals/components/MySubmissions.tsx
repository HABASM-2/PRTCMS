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

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { ScrollArea } from "@/components/ui/scroll-area";

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

interface FinalDecision {
  status: string;
  reason?: string | null;
  decidedBy: string;
  decidedAt: string;
}

interface Submission {
  id: number;
  title: string;
  status: string; // from finalDecision.status or PENDING
  updatedAt: string;
  versions: Version[];
  finalDecision: FinalDecision | null;
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
                <th className="p-2 text-left">Final Decision Status</th>
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
                    {sub.status === "NEEDS_MODIFICATION" && (
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
            <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-0">
              <DialogHeader className="px-6 py-4">
                <DialogTitle>Submission Details</DialogTitle>
                <DialogDescription>
                  Review the status, comments from reviewers, and final
                  decision.
                </DialogDescription>
              </DialogHeader>

              {/* Make whole modal scrollable */}
              <ScrollArea className="max-h-[600px] px-6 pb-6">
                {viewingSubmission && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold">
                        {viewingSubmission.title}
                      </h4>
                      <p>
                        <strong>Final Decision Status:</strong>{" "}
                        {viewingSubmission.status}
                      </p>
                      <p>
                        <strong>Last Updated:</strong>{" "}
                        {new Date(viewingSubmission.updatedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Proposal info table-like display */}
                    {viewingSubmission.versions.length > 0 && (
                      <div className="p-4 rounded bg-gray-100 dark:bg-gray-700">
                        <h5 className="font-semibold mb-4">
                          Latest Version Details
                        </h5>
                        {(() => {
                          const latestVersion =
                            viewingSubmission.versions[
                              viewingSubmission.versions.length - 1
                            ];
                          return (
                            <table className="w-full text-left">
                              <tbody>
                                <tr>
                                  <td className="align-top font-semibold pr-4">
                                    Title
                                  </td>
                                  <td>{latestVersion.title}</td>
                                </tr>
                                <tr>
                                  <td className="align-top font-semibold pr-4">
                                    Description
                                  </td>
                                  <td style={{ whiteSpace: "pre-wrap" }}>
                                    {latestVersion.description ||
                                      "No description"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="align-top font-semibold pr-4">
                                    Participants
                                  </td>
                                  <td>
                                    {latestVersion.participants.length > 0
                                      ? latestVersion.participants.join(", ")
                                      : "No participants"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="align-top font-semibold pr-4">
                                    File
                                  </td>
                                  <td>
                                    {latestVersion.fileUrl ? (
                                      <a
                                        href={latestVersion.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                      >
                                        View File
                                      </a>
                                    ) : (
                                      "No file uploaded"
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}

                    {/* Reviewer Comments History with accordions */}
                    <div>
                      <h5 className="font-semibold mb-2">
                        Reviewer Comments History:
                      </h5>
                      <Accordion
                        type="single"
                        collapsible
                        className="space-y-2"
                      >
                        {viewingSubmission.versions.length > 0 ? (
                          viewingSubmission.versions.map((version) => (
                            <AccordionItem
                              key={version.versionNumber}
                              value={`version-${version.versionNumber}`}
                              className="border rounded bg-white dark:bg-gray-800"
                            >
                              <AccordionTrigger className="font-semibold text-lg">
                                Version {version.versionNumber} -{" "}
                                {version.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                {/* Version file url */}
                                <p className="mb-4">
                                  <strong>File:</strong>{" "}
                                  {version.fileUrl ? (
                                    <a
                                      href={version.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      View File
                                    </a>
                                  ) : (
                                    "No file uploaded"
                                  )}
                                </p>

                                {version.reviews.length > 0 ? (
                                  version.reviews.map((review) => (
                                    <div
                                      key={review.id}
                                      className="mb-3 p-3 border rounded bg-gray-100 dark:bg-gray-700"
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
                                        {new Date(
                                          review.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p>No reviews for this version.</p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))
                        ) : (
                          <p>No reviewer comments available.</p>
                        )}
                      </Accordion>
                    </div>

                    {/* Final Decision Section */}
                    {viewingSubmission.finalDecision && (
                      <div className="mt-6 p-4 border rounded bg-yellow-50 dark:bg-yellow-900">
                        <h5 className="font-semibold mb-2">Final Decision</h5>
                        <p>
                          <strong>Status:</strong>{" "}
                          {viewingSubmission.finalDecision.status}
                        </p>
                        <p>
                          <strong>Reason:</strong>{" "}
                          {viewingSubmission.finalDecision.reason ||
                            "No reason provided"}
                        </p>
                        <p>
                          <strong>Decided By:</strong>{" "}
                          {viewingSubmission.finalDecision.decidedBy}
                        </p>
                        <p>
                          <strong>Decided At:</strong>{" "}
                          {new Date(
                            viewingSubmission.finalDecision.decidedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="px-6 py-4">
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
