// components/ViewNoticeModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { format } from "date-fns";

interface ViewNoticeModalProps {
  notice: {
    id: string;
    title: string;
    description?: string;
    orgUnitName?: string;
    createdAt: string;
    expiresAt?: string;
    submittedBy: string;
    fileUrl?: string | null;
  };
}

export function ViewNoticeModal({ notice }: ViewNoticeModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <EyeIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Proposal Notice Details</DialogTitle>
          <DialogDescription>
            Full information for: {notice.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <strong>Title:</strong> {notice.title}
          </div>

          {notice.description && (
            <div>
              <strong>Description:</strong>
              <p className="whitespace-pre-wrap">{notice.description}</p>
            </div>
          )}

          <div>
            <strong>Submitted By:</strong> {notice.submittedBy}
          </div>

          <div>
            <strong>Organisation Unit:</strong> {notice.orgUnitName || "N/A"}
          </div>

          <div>
            <strong>Created At:</strong>{" "}
            {format(new Date(notice.createdAt), "PPPp")}
          </div>

          {notice.expiresAt && (
            <div>
              <strong>Expires At:</strong>{" "}
              {format(new Date(notice.expiresAt), "PPPp")}
            </div>
          )}

          {notice.fileUrl && (
            <div>
              <strong>Attached File:</strong>{" "}
              <a
                href={notice.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                View / Download
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
