"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Propoval {
  userId: number;
}

// ----------- Chat Component -----------
function CommitteeChat({
  committeeId,
  currentUserId,
}: {
  committeeId: number;
  currentUserId: number;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(
        `/api/central-committee/chat?committeeId=${committeeId}`
      );
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [committeeId]);

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/central-committee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committeeId,
          senderId: currentUserId,
          content: newMessage,
        }),
      });
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col border rounded p-2 h-full">
      <ScrollArea className="flex-1 mb-2" ref={scrollRef}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded max-w-xs break-words ${
                  msg.sender.id === currentUserId
                    ? "bg-blue-100 self-end"
                    : "bg-gray-100 self-start"
                }`}
              >
                <span className="font-semibold text-sm">
                  {msg.sender.fullName}:
                </span>{" "}
                <span>{msg.content}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-auto">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} disabled={loading}>
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}

// ----------- Manage Members Component -----------
function CommitteeManager({ userId }: Propoval) {
  const [open, setOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [committee, setCommittee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/central-committee");
      const data = await res.json();
      setAllUsers(data.users);
      setMembers(data.members);
      setCommittee(data.committee);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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

  const filteredUsers = allUsers.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>Manage Central Committee</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[800px] w-[90%]">
          <DialogHeader>
            <DialogTitle>Central Committee Members</DialogTitle>
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

// ----------- Chat Button Component -----------
function CommitteeChatButton({ userId }: Propoval) {
  const [open, setOpen] = useState(false);
  const [committee, setCommittee] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    fetchCommittee();
  }, [open]);

  async function fetchCommittee() {
    try {
      const res = await fetch("/api/central-committee");
      const data = await res.json();
      setCommittee(data.committee);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Central Committee Chat</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[1200px] w-[90%]">
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
    </>
  );
}

// ----------- Exported Main Component -----------
export default function CentralCommittee({ userId }: Propoval) {
  return (
    <div className="flex gap-4">
      <CommitteeManager userId={userId} />
      <CommitteeChatButton userId={userId} />
    </div>
  );
}
