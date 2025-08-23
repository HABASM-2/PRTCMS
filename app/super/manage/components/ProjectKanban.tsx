"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

const statuses: Task["status"][] = ["PENDING", "IN_PROGRESS", "COMPLETED"];

const columnColors: Record<Task["status"], string> = {
  PENDING: "from-yellow-100/70 to-yellow-200/50",
  IN_PROGRESS: "from-blue-100/70 to-blue-200/50",
  COMPLETED: "from-green-100/70 to-green-200/50",
};

const cardColors: Record<Task["status"], string> = {
  PENDING: "bg-yellow-50/80 dark:bg-yellow-800/60",
  IN_PROGRESS: "bg-blue-50/80 dark:bg-blue-800/60",
  COMPLETED: "bg-green-50/80 dark:bg-green-800/60",
};

export default function ProjectKanban({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks`);
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast("Operation successful!", {
          description: "Everything worked as expected.",
          duration: 6000,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [projectId]);

  const showNotification = (
    msg: string,
    variant: "default" | "destructive" = "default"
  ) => {
    if (variant === "destructive") {
      toast.error(msg); // red/error toast
    } else {
      toast(msg); // default toast
    }
  };

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    setAddingTask(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const newTask: Task = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setNewTaskTitle("");
      toast.success("Task added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: number
  ) => {
    if (editingTaskId) return;
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    status: Task["status"]
  ) => {
    const taskId = Number(e.dataTransfer.getData("taskId"));
    if (!taskId) return;

    const oldStatus = tasks.find((t) => t.id === taskId)?.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      showNotification("Task status updated!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to update task status.", "destructive");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: oldStatus || "PENDING" } : t
        )
      );
    }
  };

  const handleRename = async (taskId: number) => {
    const newTitle = editingTitle.trim();
    if (!newTitle) return;

    const oldTitle = tasks.find((t) => t.id === taskId)?.title || "";

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
    );
    setEditingTaskId(null);
    setEditingTitle("");

    try {
      await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      showNotification("Task renamed!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to rename task.", "destructive");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title: oldTitle } : t))
      );
    }
  };

  const handleDelete = async (taskId: number) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await fetch(`/api/projects/${projectId}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      showNotification("Task deleted!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to delete task.", "destructive");
      setTasks((prev) => [...prev, taskToDelete]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  const tasksByStatus = statuses.reduce<Record<string, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-2">
      <ScrollArea className="w-full overflow-x-auto">
        <div className="flex gap-4 p-4">
          {statuses.map((status) => (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              className="min-w-[280px] max-h-[520px] flex flex-col rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div
                className={`p-2 rounded-t-2xl font-semibold text-base text-center bg-gradient-to-b ${columnColors[status]} dark:from-opacity-50 dark:to-opacity-30`}
              >
                {status.replace("_", " ")}
              </div>

              <ScrollArea className="flex-1 p-2 space-y-2 overflow-y-auto">
                {tasksByStatus[status].map((task) => (
                  <div
                    key={task.id}
                    draggable={editingTaskId !== task.id}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDoubleClick={() => {
                      setEditingTaskId(task.id);
                      setEditingTitle(task.title);
                    }}
                    className={`p-3 min-h-[60px] rounded-lg shadow-md transition-transform duration-200
                      ${cardColors[status]} 
                      ${
                        editingTaskId === task.id
                          ? ""
                          : "hover:scale-105 hover:shadow-xl"
                      }
                      flex items-center justify-between text-sm relative`}
                  >
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-1 items-center">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(task.id);
                            if (e.key === "Escape") setEditingTaskId(null);
                          }}
                          autoFocus
                          className="text-sm flex-1"
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRename(task.id)}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTaskId(null)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-between items-center">
                        <span>{task.title}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 hover:opacity-100 transition-opacity absolute right-2 top-2"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>

              {status === "PENDING" && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex gap-2 rounded-b-2xl">
                  <Input
                    placeholder="New task"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    disabled={addingTask}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTask}
                    disabled={addingTask}
                  >
                    {addingTask ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
