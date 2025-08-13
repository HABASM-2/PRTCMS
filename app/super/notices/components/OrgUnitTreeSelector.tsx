"use client";
import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OrgUnitNode {
  id: number;
  name: string;
  children: OrgUnitNode[];
}

interface OrgUnitTreeSelectorProps {
  tree: OrgUnitNode[];
  onChange: (selectedIds: number[]) => void;
}

export default function OrgUnitTreeSelector({
  tree,
  onChange,
}: OrgUnitTreeSelectorProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Map for quick parent/child lookup
  const unitMap = useMemo(() => {
    const map = new Map<number, OrgUnitNode & { parentId: number | null }>();
    const buildMap = (node: OrgUnitNode, parentId: number | null = null) => {
      map.set(node.id, { ...node, parentId });
      node.children.forEach((child) => buildMap(child, node.id));
    };
    tree.forEach((root) => buildMap(root));
    return map;
  }, [tree]);

  // Default selection: root + first-level children
  useEffect(() => {
    if (tree.length > 0) {
      const root = tree[0];
      const defaultSelected = [root.id, ...root.children.map((c) => c.id)];
      setSelected(defaultSelected);
      setExpanded(new Set([root.id]));
    }
  }, [tree]);

  // Get all children ids recursively
  const getAllChildrenIds = (node: OrgUnitNode): number[] => {
    return node.children.reduce(
      (acc: number[], child: OrgUnitNode) => [
        ...acc,
        child.id,
        ...getAllChildrenIds(child),
      ],
      []
    );
  };

  // Get all parent ids
  const getParentIds = (id: number): number[] => {
    const parents: number[] = [];
    let current = unitMap.get(id);
    while (current?.parentId) {
      parents.push(current.parentId);
      current = unitMap.get(current.parentId);
    }
    return parents;
  };

  // Handle checking/unchecking
  const handleCheck = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);

      const node = unitMap.get(id);
      if (!node) return prev;

      if (checked) {
        // Add node + all children
        newSelected.add(id);
        getAllChildrenIds(node).forEach((cid) => newSelected.add(cid));
        // Add all parents
        getParentIds(id).forEach((pid) => newSelected.add(pid));
      } else {
        // Remove node + all children
        newSelected.delete(id);
        getAllChildrenIds(node).forEach((cid) => newSelected.delete(cid));
      }

      return Array.from(newSelected);
    });
  };

  // Get only lowest selected nodes (nodes without selected children)
  const getLowestSelected = (): number[] => {
    const selectedSet = new Set(selected);
    const leaves: number[] = [];

    const dfs = (node: OrgUnitNode) => {
      if (selectedSet.has(node.id)) {
        const hasSelectedChild = node.children.some((c) =>
          selectedSet.has(c.id)
        );
        if (!hasSelectedChild) leaves.push(node.id);
      }
      node.children.forEach(dfs);
    };

    tree.forEach(dfs);
    return leaves;
  };

  // Trigger onChange with lowest selected nodes
  useEffect(() => {
    onChange(getLowestSelected());
  }, [selected]);

  // Toggle expand/collapse
  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Recursive render
  const renderNode = (node: OrgUnitNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id} className={cn("ml-4", level === 0 && "ml-0")}>
        <div className="flex items-center gap-2">
          {hasChildren && (
            <span
              className="cursor-pointer"
              onClick={() => toggleExpand(node.id)}
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          )}
          {!hasChildren && <span style={{ width: 16 }} />} {/* spacer */}
          <Checkbox
            checked={selected.includes(node.id)}
            onCheckedChange={(checked) => handleCheck(node.id, !!checked)}
          />
          <span>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div>{tree.map((root) => renderNode(root))}</div>;
}
