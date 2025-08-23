"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import ProjectKanban from "./ProjectKanban";
import BudgetManager, { Budget } from "./BudgetManager";
import React from "react";

interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  totalBudget: number;
  budgets: Budget[];
  tasks: { id: number; title: string; status: string }[];
  spent: number;
  remaining: number;
}
interface propos {
  userId: number;
}

export default function ProjectsPage({ userId }: propos) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");

      const data = await res.json();
      const normalized: Project[] = (data.data ?? []).map((p: any) => {
        // Calculate spent & remaining from budgets
        const totalSpent = (p.budgets ?? []).reduce(
          (sum: number, b: any) => sum + (b.amount ?? 0),
          0
        );
        const remaining = (p.totalBudget ?? 0) - totalSpent;
        return {
          ...p,
          budgets: (p.budgets ?? []).map((b: any) => ({
            ...b,
            spent: b.spent ?? 0,
          })),
          spent: totalSpent,
          remaining,
          totalBudget: Number(p.totalBudget ?? 0),
        };
      });

      setProjects(normalized);
      setTotalPages(Number(data.pagination?.totalPages ?? 1));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, pageSize, statusFilter]);

  // Live update: applies even to main table row
  const handleBudgetChange = (
    projectId: number,
    updatedBudgets: Budget[],
    totals: { totalSpent: number; remaining: number; totalAllocated: number }
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              budgets: updatedBudgets,
              totalBudget: totals.totalAllocated,
              spent: totals.totalSpent,
              remaining: totals.remaining,
            }
          : p
      )
    );
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Your Projects</CardTitle>
          <Select
            onValueChange={(v) => {
              setPage(1);
              setStatusFilter(v);
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No projects found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Allocated Budget</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining / Debt</TableHead>
                  <TableHead>Budgets</TableHead>
                  <TableHead>Tasks</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {projects.map((project) => {
                  const isExpanded = expandedProject === project.id;

                  // Use up-to-date totals directly here
                  const spent = project.spent ?? 0;
                  const remaining = project.remaining ?? 0;
                  return (
                    <React.Fragment key={project.id}>
                      <TableRow
                        key={`${project.id}-${project.spent}-${project.remaining}`}
                        onClick={() =>
                          setExpandedProject((prev) =>
                            prev === project.id ? null : project.id
                          )
                        }
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {project.title}
                        </TableCell>
                        <TableCell>
                          <Badge>{project.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{project.totalBudget.toFixed(2)}</TableCell>
                        <TableCell>{project.spent.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={remaining >= 0 ? "default" : "destructive"}
                          >
                            {remaining >= 0
                              ? remaining.toFixed(2)
                              : `Debt ${Math.abs(remaining).toFixed(2)}`}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.budgets.length}</TableCell>
                        <TableCell>{project.tasks.length}</TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0">
                            <div className="flex border-t border-gray-200 dark:border-gray-700">
                              <div className="flex-1 p-2">
                                <ProjectKanban projectId={project.id} />
                              </div>
                              <div className="w-[25%] p-2 border-l border-gray-200 dark:border-gray-700 ml-auto">
                                <BudgetManager
                                  projectId={project.id}
                                  budgets={project.budgets}
                                  allocatedBudget={project.totalBudget}
                                  onChange={(updatedBudgets, totals) =>
                                    handleBudgetChange(
                                      project.id,
                                      updatedBudgets,
                                      totals
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && projects.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
