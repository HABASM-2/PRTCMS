"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronDown } from "lucide-react";

type OrgUnitWithChildren = {
  id: number;
  name: string;
  children: OrgUnitWithChildren[];
};

interface TreeNodeProps {
  node: OrgUnitWithChildren;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function TreeNode({ node, selectedId, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className="ml-4 mt-1">
      <div className="flex items-center gap-1">
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <input
          type="radio"
          checked={selectedId === node.id}
          onChange={() => onSelect(node.id)}
          className="mr-2"
        />
        <span className="text-gray-800 dark:text-gray-100">{node.name}</span>
      </div>

      {hasChildren && expanded && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgTree, setOrgTree] = useState<OrgUnitWithChildren[]>([]);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch OrgUnit tree
  useEffect(() => {
    const fetchOrgTree = async () => {
      try {
        const res = await fetch("/api/orgunits");
        const data = await res.json();
        setOrgTree(data);
      } catch {
        toast.error("Failed to load organisation units");
      }
    };
    fetchOrgTree();
  }, []);

  // Live username/email check
  useEffect(() => {
    if (!username && !email) return;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (username) params.append("username", username);
        if (email) params.append("email", email);

        const res = await fetch(
          `/api/users/check-availability?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to check availability");

        const data = await res.json();
        setUsernameAvailable(data.usernameAvailable);
        setEmailAvailable(data.emailAvailable);
      } catch (err) {
        console.error(err);
        setUsernameAvailable(null);
        setEmailAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, email]);

  const validatePassword = (pwd: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);
  };

  const handleRegister = async () => {
    if (username.length < 6) {
      toast.error("Username must be at least 6 characters");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }
    if (emailAvailable === false) {
      toast.error("Email is already registered");
      return;
    }
    if (!validatePassword(password)) {
      toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!selectedOrgUnit) {
      toast.error("Please select an organisation unit");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          username,
          password,
          orgUnitId: selectedOrgUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Registration submitted! Awaiting approval.");
      setFullName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setSelectedOrgUnit(null);
      setUsernameAvailable(null);
      setEmailAvailable(null);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-md dark:shadow-lg rounded-2xl p-8 space-y-6 border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
          PRTCMS Registration
        </h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="dark:text-gray-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
            {email && (
              <p
                className={`text-sm mt-1 ${
                  emailAvailable
                    ? "text-green-500"
                    : emailAvailable === false
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {emailAvailable === null
                  ? "Checking email..."
                  : emailAvailable
                  ? "Email is available"
                  : "Email is already registered"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="username" className="dark:text-gray-300">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
            {username.length >= 6 && (
              <p
                className={`text-sm mt-1 ${
                  usernameAvailable
                    ? "text-green-500"
                    : usernameAvailable === false
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {usernameAvailable === null
                  ? "Checking availability..."
                  : usernameAvailable
                  ? "Username is available"
                  : "Username is taken"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="dark:text-gray-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="dark:text-gray-300">
              Select Organisation Unit
            </Label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded p-2 mt-1">
              {orgTree.length > 0 ? (
                orgTree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    selectedId={selectedOrgUnit}
                    onSelect={setSelectedOrgUnit}
                  />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Loading org units...
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Registering..." : "Register"}
          </Button>
        </div>
      </div>
    </main>
  );
}
