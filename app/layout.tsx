import type React from "react";
import { MemoryProvider } from "./context/memory-context";
import type { Metadata } from "next";
import { MemoryDialogProvider } from "./context/memory-dialog-provider";
import { YearProvider } from "./context/year-context";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "lena",
  description: "Memory tracking application",
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
            <MemoryDialogProvider>{children}</MemoryDialogProvider>
          </YearProvider>
        </MemoryProvider>
      </body>
    </html>
  );
}
