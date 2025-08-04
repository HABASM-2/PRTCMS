"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import OrgUnitTreeSelector from "./OrgUnitTreeSelector";

interface Props {
  userId?: number; // optional
  organisationId: number;
  onChange: (selected: number[]) => void;
}

export default function OrgUnitSelector({
  userId,
  organisationId,
  onChange,
}: Props) {
  const [orgUnitTree, setOrgUnitTree] = useState<any[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const stableOnChange = useRef(onChange);
  useEffect(() => {
    stableOnChange.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const loadOrgUnits = async () => {
      setLoading(true);
      setOrgUnitTree([]);
      setSelectedOrgUnitIds([]);

      try {
        const url =
          userId !== undefined
            ? `/api/orgunits/tree?id=${organisationId}&userId=${userId}`
            : `/api/orgunits/tree?id=${organisationId}`;

        const res = await fetch(url);
        const data = await res.json();

        setOrgUnitTree(data.tree || data || []);
        const assigned = data.assignedOrgUnitIds || [];
        setSelectedOrgUnitIds(assigned);
        stableOnChange.current(assigned);
      } catch (err) {
        console.error("Failed to load organisation units", err);
      } finally {
        setLoading(false);
      }
    };

    if (organisationId) {
      loadOrgUnits();
    }
  }, [userId, organisationId]);

  if (loading) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
        Loading organisation units...
      </div>
    );
  }

  return (
    <OrgUnitTreeSelector
      tree={orgUnitTree}
      selectedIds={selectedOrgUnitIds}
      onChange={(ids) => {
        setSelectedOrgUnitIds(ids);
        stableOnChange.current(ids);
      }}
    />
  );
}
