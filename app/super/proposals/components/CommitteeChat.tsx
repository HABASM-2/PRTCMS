"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  committeeId: number;
  currentUserId: number;
}

export default function CommitteeChat({ committeeId, currentUserId }: Props) {
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
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
