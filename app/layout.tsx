//layout.tsx
import type React from "react";
import { MemoryProvider } from "@/app/context/memory-context";
import type { Metadata } from "next";
import { MemoryDialogProvider } from "./context/memory-dialog-provider";
import { YearProvider } from "./context/year-context";
import { UserProvider } from "./context/user-context";
import "./globals.css";
import { Inter } from "next/font/google";

import { CollapsibleSidebar } from "./components/CollapsibleSidebar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "lena",
  description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable} 
          antialiased 
          relative 
          flex   
          h-screen 
          w-screen
          overflow-hidden
          bg-black
          font-sans
        `}
      >
        <UserProvider>
          <MemoryProvider>
            <YearProvider>
              <MemoryDialogProvider>
                {/* Sidebar on the left */}
                <CollapsibleSidebar />

                {/* The rest of the screen for the page's main content */}
                <main className="flex-1 overflow-auto relative">{children}</main>

                {/* Add Sonner Toaster component */}
                <Toaster position="bottom-right" theme="dark" />
              </MemoryDialogProvider>
            </YearProvider>
          </MemoryProvider>
        </UserProvider>
      </body>
    </html>
  );
}
