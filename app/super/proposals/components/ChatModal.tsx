"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import CommitteeChat from "./CommitteeChat";

interface Props {
  chatProposalId: number | null;
  userId: number;
  onClose: () => void;
}

export default function ChatModal({ chatProposalId, userId, onClose }: Props) {
  const [committee, setCommittee] = useState<any>(null);

  useEffect(() => {
    if (!chatProposalId) return;
    async function fetchCommittee() {
      try {
        const res = await fetch("/api/central-committee");
        const data = await res.json();
        setCommittee(data.committee);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCommittee();
  }, [chatProposalId]);

  if (!chatProposalId) return null;

  return (
    <Dialog open={!!chatProposalId} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] w-[90%] h-[600px]">
        <DialogHeader>
          <DialogTitle>Committee Chat</DialogTitle>
        </DialogHeader>

        {committee?.id ? (
          <CommitteeChat committeeId={committee.id} currentUserId={userId} />
        ) : (
          <div className="flex justify-center p-6">
            <Loader2 className="animate-spin w-6 h-6" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
