"use client";

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4">
      <h1 className="text-6xl font-bold mb-4">403</h1>
      <h2 className="text-2xl mb-6">
        Forbidden — You don’t have access to this page.
      </h2>
      <p className="mb-6 text-center max-w-md">
        Sorry, you don’t have permission to view this resource. If you think
        this is a mistake, please contact your administrator.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Home
      </Link>
    </div>
  );
}
