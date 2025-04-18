//memories/[year]/loading.tsx
"use client";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-white flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
        <p>Loading memories...</p>
      </div>
    </div>
  );
}
