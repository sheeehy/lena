import type React from "react";
import { MemoryProvider } from "@/app/memory-context";
import type { Metadata } from "next";
import { MemoryDialogProvider } from "./memory-dialog-provider";
import { YearProvider } from "./year-context";
import "./globals.css";
import { Inter } from "next/font/google";

import { CollapsibleSidebar } from "./CollapsibleSidebar";

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
        <MemoryProvider>
          <YearProvider>
            <MemoryDialogProvider>
              {/* Sidebar on the left */}
              <CollapsibleSidebar />

              {/* The rest of the screen for the page's main content */}
              <main className="flex-1 overflow-auto relative">{children}</main>
            </MemoryDialogProvider>
          </YearProvider>
        </MemoryProvider>
      </body>
    </html>
  );
}
