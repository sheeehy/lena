// app/layout.tsx (RootLayout)

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          relative 
          flex   
          h-screen 
          w-screen
          overflow-hidden
          bg-black
        `}
      >
        {/* Sidebar on the left */}
        <CollapsibleSidebar />

        {/* The rest of the screen for the page’s main content */}
        <main className="flex-1 overflow-auto relative">
          {/* If you still want a global overlay or vignette, place it here or inside children */}
          <div className="vignette-overlay pointer-events-none" />

          {children}
        </main>
      </body>
    </html>
  );
}
