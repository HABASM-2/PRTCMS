"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OrgUnit {
  id: number;
  name: string;
  children?: OrgUnit[];
  parentId?: number | null;
}

interface Props {
  tree: OrgUnit[];
  selectedIds?: number[];
  onChange: (ids: number[]) => void;
}

export default function OrgUnitTreeSelector({
  tree,
  selectedIds = [],
  onChange,
}: Props) {
  const flattenTree = (units: OrgUnit[]): OrgUnit[] => {
    const result: OrgUnit[] = [];
    const traverse = (list: OrgUnit[]) => {
      for (const unit of list) {
        result.push(unit);
        if (unit.children) traverse(unit.children);
      }
    };
    traverse(units);
    return result;
  };

  const allUnits = flattenTree(tree);

  const findTopRoot = (): OrgUnit | null => {
    const all = flattenTree(tree);
    const unitMap = new Map<number, OrgUnit>();
    all.forEach((u) => unitMap.set(u.id, u));
    let current = all[0];
    while (current?.parentId !== null) {
      const parent = unitMap.get(current.parentId!);
      if (!parent) break;
      current = parent;
    }
    return current ?? null;
  };

  const topRoot = findTopRoot();
  const rootId = topRoot?.id;

  const [selected, setSelected] = useState<number[]>(() => {
    const initial = new Set(selectedIds);
    if (rootId !== undefined) initial.add(rootId); // Always include root
    return Array.from(initial);
  });

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (rootId !== undefined && !selected.includes(rootId)) {
      setSelected((prev) => [...prev, rootId]);
    }
  }, [rootId]);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectWithParents = (
    unit: OrgUnit,
    allUnits: OrgUnit[],
    current: number[]
  ): number[] => {
    const updated = new Set(current);
    updated.add(unit.id);

    let parentId = unit.parentId;
    while (parentId !== null && parentId !== undefined && parentId !== rootId) {
      const parent = allUnits.find((u) => u.id === parentId);
      if (!parent) break;
      updated.add(parent.id);
      parentId = parent.parentId;
    }

    return Array.from(updated);
  };

  const removeWithChildren = (unit: OrgUnit, current: number[]): number[] => {
    const updated = new Set(current);
    const removeIds = collectChildren(unit);
    removeIds.push(unit.id);
    for (const id of removeIds) {
      if (id !== rootId) updated.delete(id); // Never remove root
    }
    return Array.from(updated);
  };

  const collectChildren = (unit: OrgUnit): number[] => {
    const result: number[] = [];
    const stack = [...(unit.children || [])];
    while (stack.length) {
      const current = stack.pop()!;
      result.push(current.id);
      if (current.children) stack.push(...current.children);
    }
    return result;
  };

  const renderTree = (units: OrgUnit[], allUnits: OrgUnit[], depth = 0) => {
    return units.map((unit) => {
      const isChecked = selected.includes(unit.id);
      const hasChildren = unit.children && unit.children.length > 0;
      const isOpen = expanded[unit.id];
      const isRoot = unit.id === rootId;

      return (
        <div key={unit.id} className="pl-4">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => toggleExpand(unit.id)}
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            ) : (
              <div className="w-8" />
            )}

            <Checkbox
              checked={isChecked}
              disabled={isRoot}
              onCheckedChange={(checked) => {
                if (isRoot) return;
                if (checked) {
                  setSelected(selectWithParents(unit, allUnits, selected));
                } else {
                  setSelected(removeWithChildren(unit, selected));
                }
              }}
            />
            <span className={isRoot ? "font-semibold text-primary" : ""}>
              {unit.name}
            </span>
          </div>

          {hasChildren && isOpen && (
            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
              {renderTree(unit.children!, allUnits, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return <div>{renderTree(tree, allUnits)}</div>;
}
