"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  userId: number;
}

export default function CentralCommittee({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/central-committee");
      const data = await res.json();
      setAllUsers(data.users);
      setMembers(data.members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchData();
  }, [open]);

  async function addMember(userId: number) {
    setLoading(true);
    try {
      await fetch("/api/central-committee", {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(userId: number) {
    setLoading(true);
    try {
      await fetch("/api/central-committee", {
        method: "DELETE",
        body: JSON.stringify({ userId }),
        headers: { "Content-Type": "application/json" },
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const [search, setSearch] = useState("");
  const filteredUsers = allUsers.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>Manage Committee</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[800px] w-[90%]">
          <DialogHeader>
            <DialogTitle>Committee Members</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold mb-2">Current Members</h2>
              <ScrollArea className="max-h-60 border rounded p-2 mb-4">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No members yet
                  </p>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center py-1 border-b last:border-none"
                    >
                      <span>{m.fullName}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMember(m.id)}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>

              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />

              <ScrollArea className="max-h-60 border rounded p-2">
                {filteredUsers.map((u) => {
                  const isMember = members.some((m) => m.id === u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex justify-between items-center py-1 border-b last:border-none"
                    >
                      <span>{u.fullName}</span>
                      {isMember ? (
                        <span className="text-xs text-muted-foreground">
                          Already a member
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMember(u.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
