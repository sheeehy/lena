"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useYear } from "../context/year-context";

export default function MemoriesPage() {
  const router = useRouter();
  const { selectedYear } = useYear();

  useEffect(() => {
    // Redirect to the selected year
    router.push(`/memories/${selectedYear}`);
  }, [router, selectedYear]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-white">Loading year data...</div>
    </div>
  );
}
