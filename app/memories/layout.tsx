import type { ReactNode } from "react";
import { CollapsibleSidebar } from "../components/CollapsibleSidebar";

export default function MemoriesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      {/* Sidebar on the left */}

      {/* The rest of the screen for the page's main content */}
      <main className="flex-1 overflow-auto relative">{children}</main>
    </div>
  );
}
