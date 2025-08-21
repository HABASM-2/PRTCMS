"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, Trash2, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  proposalId: number;
  currentUserId: number;
  onClose?: () => void;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  sender: { id: number; fullName: string };
}

export default function ProposalChatSidePanel({
  proposalId,
  currentUserId,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/central-committee/chat?proposalId=${proposalId}`
      );
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  }, [proposalId]);

  // Polling every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto scroll to bottom smoothly
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Send new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/central-committee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
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
  };

  // Edit existing message
  const saveEdit = async (messageId: number) => {
    if (!editingContent.trim()) return;
    try {
      await fetch(`/api/central-committee/chat/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editingContent,
          senderId: currentUserId,
        }),
      });
      setEditingMessageId(null);
      setEditingContent("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: number) => {
    try {
      await fetch(`/api/central-committee/chat/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUserId }),
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[450px] bg-background shadow-lg flex flex-col z-50 border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Proposal Chat</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 space-y-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender.id === currentUserId;
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`max-w-[75%] p-3 rounded-xl break-words relative ${
                  isCurrentUser
                    ? "bg-blue-600 text-white self-end ml-auto"
                    : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start mr-auto"
                }`}
              >
                {!isCurrentUser && (
                  <p className="font-semibold text-sm mb-1">
                    {msg.sender.fullName}
                  </p>
                )}

                {/* Message Content */}
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => saveEdit(msg.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => setEditingMessageId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground absolute bottom-1 right-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {/* Edit/Delete buttons */}
                {isCurrentUser && !isEditing && (
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditingContent(msg.content);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={() => deleteMessage(msg.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border flex gap-2">
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
