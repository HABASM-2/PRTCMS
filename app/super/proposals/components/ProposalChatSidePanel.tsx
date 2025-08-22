"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  Paperclip,
  FileText,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  proposalId: number;
  currentUserId: number;
  onClose?: () => void;
}

interface Message {
  id: number;
  content: string;
  fileURL?: string | null;
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
  const [file, setFile] = useState<File | null>(null);
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

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => scrollToBottom(), [messages]);

  // Send new message
  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;

    setLoading(true);
    let fileURL: string | undefined;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) fileURL = uploadData.url;
      }

      const res = await fetch("/api/central-committee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          senderId: currentUserId,
          content: newMessage,
          fileURL,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setNewMessage("");
      setFile(null);
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Edit message
  const saveEdit = async (messageId: number) => {
    if (!editingContent.trim()) return;

    try {
      const res = await fetch(`/api/central-committee/chat/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editingContent,
          senderId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setEditingMessageId(null);
      setEditingContent("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/central-committee/chat/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUserId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

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

      {/* Messages */}
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
                  <>
                    {msg.content && (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.fileURL && (
                      <div className="mt-2 flex items-center gap-2">
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileURL) ? (
                          <a
                            href={msg.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={msg.fileURL}
                              alt="uploaded file"
                              className="max-w-[200px] rounded-lg border border-border"
                            />
                          </a>
                        ) : (
                          <a
                            href={msg.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded border"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm truncate max-w-[150px]">
                              {msg.fileURL.split("/").pop()}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}

                <span className="text-xs text-muted-foreground absolute bottom-1 right-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

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
      <div className="p-4 border-t border-border flex flex-col gap-2">
        {file && (
          <div className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <FileText className="w-8 h-8" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setFile(null)}
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <label className="cursor-pointer flex items-center gap-1">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

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
    </div>
  );
}
