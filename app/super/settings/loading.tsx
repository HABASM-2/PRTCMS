// app/super/users-and-orgunits/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-300" />
      <span className="ml-2 text-gray-700 dark:text-gray-200">Loading...</span>
    </div>
  );
}
