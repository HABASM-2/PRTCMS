"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Check, X } from "lucide-react";

export interface Budget {
  id: number;
  item: string;
  amount: number;
}

type Totals = {
  totalAllocated: number;
  totalSpent: number;
  remaining: number;
};

type BudgetsResponse = {
  budgets: Budget[];
  totalAllocated: number;
  totalSpent: number;
  remaining: number;
  error?: string;
};

interface Props {
  projectId: number;
  budgets: Budget[];
  allocatedBudget: number;
  onChange?: (updatedBudgets: Budget[], totals: Totals) => void;
  permit: "yes" | "not"; // only two values
}

export default function BudgetManager({
  projectId,
  budgets: initialBudgets,
  allocatedBudget,
  onChange,
  permit,
}: Props) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets ?? []);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState("");
  const [editingAmount, setEditingAmount] = useState("");

  // keep local state in sync with parent
  useEffect(() => {
    setBudgets(initialBudgets ?? []);
  }, [initialBudgets]);

  // safe budgets and totals
  const safeBudgets = budgets.map((b) => ({
    ...b,
    amount: Number(b.amount) || 0,
  }));
  const totalSpent = safeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const remaining = (allocatedBudget ?? 0) - totalSpent;

  const getProgressColor = (amount: number) => {
    const percent = (amount / (allocatedBudget || 1)) * 100;
    if (percent >= 100) return "bg-red-500";
    if (percent > 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const applyServerUpdate = (payload: BudgetsResponse) => {
    const cleaned = (payload.budgets ?? []).map((b) => ({
      ...b,
      amount: Number(b.amount) || 0,
    }));
    setBudgets(cleaned);
    onChange?.(cleaned, {
      totalAllocated: Number(payload.totalAllocated ?? allocatedBudget) || 0,
      totalSpent: Number(payload.totalSpent ?? totalSpent) || 0,
      remaining: Number(payload.remaining ?? remaining) || 0,
    });
  };

  const handleAdd = async () => {
    if (!newItem.trim() || newAmount === "") return;
    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: newItem.trim(),
          amount: Number(newAmount),
        }),
      });
      const payload: BudgetsResponse = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to add budget");
      applyServerUpdate(payload);
      setNewItem("");
      setNewAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingItem.trim() || editingAmount === "") return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/budgets?budgetId=${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item: editingItem.trim(),
            amount: Number(editingAmount),
          }),
        }
      );
      const payload: BudgetsResponse = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to update budget");
      applyServerUpdate(payload);
      setEditingId(null);
      setEditingItem("");
      setEditingAmount("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/budgets?budgetId=${id}`,
        {
          method: "DELETE",
        }
      );
      const payload: BudgetsResponse = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete budget");
      applyServerUpdate(payload);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Totals */}
      <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md w-full max-w-md mx-auto">
        {/* Allocated Budget */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Allocated Budget
          </span>
          <span className="font-semibold text-xl">
            {(allocatedBudget ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Spent & Remaining */}
        <div className="flex flex-row justify-around mt-2 w-full">
          {/* Spent */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Spent
            </span>
            <span className="font-semibold text-lg transition-all duration-300">
              {totalSpent.toFixed(2)}
            </span>
          </div>

          {/* Remaining */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Remaining
            </span>
            <span
              className={`font-semibold text-lg transition-all duration-300 ${
                remaining >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {remaining >= 0
                ? remaining.toFixed(2)
                : Math.abs(remaining).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {safeBudgets.map((b) => {
          const amount = b.amount ?? 0;
          const percent = Math.min(
            (amount / (allocatedBudget || 1)) * 100,
            100
          );
          const editing = editingId === b.id;

          return (
            <div key={b.id} className="flex flex-col p-2 border rounded gap-1">
              {editing && permit === "yes" ? (
                <div className="flex gap-2">
                  <Input
                    value={editingItem}
                    onChange={(e) => setEditingItem(e.target.value)}
                    placeholder="Item"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editingAmount}
                    onChange={(e) => setEditingAmount(e.target.value)}
                    placeholder="Amount"
                  />
                  <Button size="sm" onClick={() => handleUpdate(b.id)}>
                    <Check />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="truncate">{b.item}</span>
                  <span className="tabular-nums">{amount.toFixed(2)}</span>

                  {permit === "yes" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingId(b.id);
                          setEditingItem(b.item ?? "");
                          setEditingAmount(String(amount));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                <div
                  className={`h-2 ${getProgressColor(
                    amount
                  )} transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Budget (only if permit is yes) */}
      {permit === "yes" && (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Amount"
            type="number"
            inputMode="decimal"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-28"
          />
          <Button
            onClick={handleAdd}
            disabled={adding || !newItem.trim() || newAmount === ""}
          >
            {adding ? <Loader2 className="animate-spin w-4 h-4" /> : "Add"}
          </Button>
        </div>
      )}
    </div>
  );
}
