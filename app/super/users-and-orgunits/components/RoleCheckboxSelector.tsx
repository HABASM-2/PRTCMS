// components/RoleCheckboxSelector.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

interface Role {
  id: number;
  name: string;
}

export default function RoleCheckboxSelector({
  roles,
  selectedIds,
  onChange,
}: {
  roles: Role[];
  selectedIds?: number[];
  onChange: (ids: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>(selectedIds || []);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  const toggle = (id: number, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((r) => r !== id)
    );
  };

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center gap-2">
          <Checkbox
            checked={selected.includes(role.id)}
            onCheckedChange={(checked) => toggle(role.id, !!checked)}
          />
          <span>{role.name}</span>
        </div>
      ))}
    </div>
  );
}
