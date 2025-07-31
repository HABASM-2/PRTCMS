"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import OrgUnitTreeSelector from "./OrgUnitTreeSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Type declarations (simplified)
type Organisation = {
  id: number;
  name: string;
};

type OrgUnit = {
  id: number;
  name: string;
};

type Role = {
  id: number;
  name: string;
};

type AddUserFormProps = {
  onSuccess?: () => void;
};

export default function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, orgsRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/organisations/select"),
        ]);

        const rolesData = await rolesRes.json();
        const orgData = await orgsRes.json();

        setRoles(rolesData);
        setOrganisations(orgData);
      } catch (error) {
        console.error("Failed to fetch roles/orgs", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchOrgUnits = async () => {
      if (!selectedOrgId) return;

      try {
        const res = await fetch(`/api/orgunits/org-units?id=${selectedOrgId}`);
        const data = await res.json();
        setOrgUnits(data);
      } catch (error) {
        console.error("Failed to fetch org units", error);
      }
    };

    fetchOrgUnits();
  }, [selectedOrgId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formValues,
      roleId: selectedRoleId,
      organisationId: selectedOrgId,
      orgUnitIds: selectedOrgUnitIds,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("User created successfully");
        setFormValues({ fullName: "", username: "", email: "", password: "" });
        setSelectedRoleId(null);
        setSelectedOrgId(null);
        setSelectedOrgUnitIds([]);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to create user");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formValues.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formValues.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Role (optional)</Label>
            <Select
              onValueChange={(val) => setSelectedRoleId(Number(val))}
              value={selectedRoleId?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Organisation</Label>
            <Select
              onValueChange={(val) => setSelectedOrgId(Number(val))}
              value={selectedOrgId?.toString() || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an organisation" />
              </SelectTrigger>
              <SelectContent>
                {organisations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedOrgId && orgUnits.length > 0 && (
          <div>
            <Label className="mb-2 block">Org Units</Label>
            <OrgUnitTreeSelector
              tree={orgUnits}
              onChange={(ids) => setSelectedOrgUnitIds(ids)}
            />
            {selectedOrgUnitIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedOrgUnitIds.length} unit
                {selectedOrgUnitIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Add User
        </Button>
      </form>
    </Card>
  );
}
