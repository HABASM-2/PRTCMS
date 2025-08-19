"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ProposalActions from "./ProposalActions";

export default function ProposalDetailsModal({
  open,
  onOpenChange,
  proposal,
  refreshProposal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: any | null;
  refreshProposal: (proposalId: number) => Promise<void>;
}) {
  const [loadingModal, setLoadingModal] = useState(false);
  const [allReviewers, setAllReviewers] = useState<any[]>([]);

  const latestVersionval = proposal?.versions?.[proposal.versions.length - 1];

  const loadAllReviewers = async () => {
    try {
      const res = await fetch("/api/users/reviewers");
      const data = await res.json();
      setAllReviewers(data);
    } catch (err) {
      console.error("Error loading reviewers", err);
      setAllReviewers([]);
    }
  };

  const openModal = async () => {
    if (!proposal) return;
    setLoadingModal(true);
    try {
      await loadAllReviewers();
    } catch (err) {
      console.error("Error loading modal data", err);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    if (open) openModal();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-6">
        <DialogHeader>
          <DialogTitle>Proposal Details</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {loadingModal ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
          </div>
        ) : proposal ? (
          <ScrollArea className="max-h-[65vh] pr-4">
            {/* Proposal Info */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{proposal.title}</h2>
              <p>
                <strong>Description:</strong> {proposal.description || "N/A"}
              </p>
              <p>
                <strong>Participants:</strong>{" "}
                {(proposal.participants || []).join(", ") || "N/A"}
              </p>
              <p>
                <strong>Submitted By:</strong> {proposal.submittedBy}
              </p>
              <p>
                <strong>Org Unit:</strong> {proposal.orgUnit}
              </p>
              <p>
                <strong>Submitted At:</strong>{" "}
                {new Date(proposal.submittedAt).toLocaleString()}
              </p>
              {proposal.fileUrl && (
                <p>
                  <strong>File:</strong>{" "}
                  <a
                    href={proposal.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View File
                  </a>
                </p>
              )}
            </div>

            <hr className="my-4" />

            {/* Versions Accordion */}
            <Accordion type="single" collapsible>
              {proposal.versions.map((version: any) => (
                <AccordionItem
                  key={version.versionNumber}
                  value={`v${version.versionNumber}`}
                >
                  <AccordionTrigger>
                    Version {version.versionNumber} —{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Title:</strong> {version.title}
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {version.description || "N/A"}
                      </p>
                      <p>
                        <strong>Participants:</strong>{" "}
                        {(version.participants || []).join(", ") || "N/A"}
                      </p>
                      {version.fileUrl && (
                        <p>
                          <strong>File:</strong>{" "}
                          <a
                            href={version.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            View File
                          </a>
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Actions: Reviewer Management + Final Decision */}
            {latestVersionval && (
              <ProposalActions
                proposal={proposal}
                latestVersion={latestVersionval}
                refreshProposal={refreshProposal}
              />
            )}
          </ScrollArea>
        ) : (
          <p>No proposal selected</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
