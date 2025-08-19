"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye } from "lucide-react";
import ProposalDetailsModal from "./ProposalModals";

function debounce<F extends (...args: any[]) => void>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

interface Props {
  userId: number;
  roles: string[];
}

export default function FinalizedProposals({ userId, roles }: Props) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  const limit = 10;
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proposals/finalized?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      setProposals(data.proposals);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const debouncedSetSearch = useCallback(
    debounce((val: string) => {
      setPage(1);
      setSearch(val);
    }, 500),
    []
  );

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  function statusIcon(status: string) {
    switch (status) {
      case "PENDING":
        return (
          <span className="text-yellow-500 font-semibold">⏳ Pending</span>
        );
      case "ACCEPTED":
        return <span className="text-green-600 font-semibold">✔ Accepted</span>;
      case "REJECTED":
        return <span className="text-red-600 font-semibold">✘ Rejected</span>;
      case "NEEDS_MODIFICATION":
        return (
          <span className="text-orange-600 font-semibold">
            ⚠ Needs Modification
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  }

  const openModal = async (proposalId: number) => {
    setOpen(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/versions`);
      const data = await res.json();
      setSelectedProposal(data);
    } catch (err) {
      console.error("Error fetching proposal versions", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search finalized proposals..."
        onChange={(e) => debouncedSetSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
        </div>
      )}

      {/* Proposals Table */}
      {!loading && proposals.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Org Unit</TableHead>
              <TableHead>Final Decision</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.submittedBy}</TableCell>
                <TableCell>{p.orgUnit}</TableCell>
                <TableCell>
                  {p.finalDecision ? statusIcon(p.finalDecision.status) : "-"}
                </TableCell>
                <TableCell>
                  {new Date(p.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(p.id)}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <Button
          disabled={page === Math.ceil(total / limit)}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>

      {/* Modal */}
      <ProposalDetailsModal
        open={open}
        onOpenChange={setOpen}
        proposal={selectedProposal}
        refreshProposal={openModal}
      />
    </div>
  );
}
