"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import axios from "axios";

interface Notice {
  id: number;
  title: string;
  type: string;
  createdBy: { id: number; fullName: string };
  orgUnits: { orgUnit: { id: number; name: string } }[];
  forwards?: {
    orgUnitId: number;
    forwardedById: number;
    forwardedAt: string;
  }[];
}

interface NoticesTabProps {
  userId: number;
  userRole: string; // "dean" | "coordinator" | "head" | "staff"
  userOrgUnitIds: number[];
}

export default function NoticesTab({
  userId,
  userRole,
  userOrgUnitIds,
}: NoticesTabProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [forwardingIds, setForwardingIds] = useState<Set<number>>(new Set());

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/notices/sharing", {
        params: { userId, search, page, pageSize },
      });

      const uniqueMap = new Map<number, Notice>();
      res.data.data.forEach((n: Notice) => {
        if (!uniqueMap.has(n.id)) uniqueMap.set(n.id, n);
      });

      setNotices(Array.from(uniqueMap.values()));
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [search, page]);

  // Role chain map: who forwards to whom
  const roleNextMap: Record<string, string | null> = {
    dean: "coordinator",
    coordinator: "head",
    head: null, // head forwards but no next role needed here
  };

  // Check if current user already forwarded this notice
  const isAlreadyForwarded = (notice: Notice) => {
    if (!notice.forwards) return false;
    return notice.forwards.some(
      (f) => userOrgUnitIds.includes(f.orgUnitId) && f.forwardedById === userId
    );
  };

  // Check if notice is visible for current user
  const canSeeNotice = (notice: Notice) => {
    if (userRole === "dean") return true;
    if (!notice.forwards) return false;

    const prevRoleMap: Record<string, string> = {
      coordinator: "dean",
      head: "coordinator",
      staff: "head",
    };

    const prevRole = prevRoleMap[userRole];
    // If previous role forwarded to any of user's orgUnits
    return notice.forwards.some((f) => userOrgUnitIds.includes(f.orgUnitId));
  };

  const handleForward = async (noticeId: number) => {
    if (forwardingIds.has(noticeId)) return;
    setForwardingIds((prev) => new Set(prev).add(noticeId));

    try {
      await axios.post(`/api/notices/${noticeId}/forward`, { userId });
      await fetchNotices();
    } catch (err) {
      console.error(err);
    } finally {
      setForwardingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(noticeId);
        return updated;
      });
    }
  };

  return (
    <div>
      <Input
        placeholder="Search notices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-64"
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>OrgUnits</TableHead>
              <TableHead>Forwarded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.filter(canSeeNotice).map((notice) => {
              const alreadyForwarded = isAlreadyForwarded(notice);
              const isForwarding = forwardingIds.has(notice.id);

              return (
                <TableRow key={notice.id}>
                  <TableCell>{notice.title}</TableCell>
                  <TableCell>{notice.type}</TableCell>
                  <TableCell>{notice.createdBy.fullName}</TableCell>
                  <TableCell>
                    {notice.orgUnits.map((o) => (
                      <span key={o.orgUnit.id} className="mr-2">
                        {o.orgUnit.name}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>
                    {notice.forwards?.some((f) => f.forwardedById === userId)
                      ? "Forwarded"
                      : ""}
                  </TableCell>
                  <TableCell>
                    <Button
                      disabled={alreadyForwarded || isForwarding}
                      onClick={() => handleForward(notice.id)}
                    >
                      {isForwarding && (
                        <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                      )}
                      {alreadyForwarded
                        ? "Forwarded"
                        : isForwarding
                        ? "Forwarding..."
                        : "Forward"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <div className="mt-4 flex gap-2">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>
        <span>Page {page}</span>
        <Button
          disabled={page * pageSize >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
