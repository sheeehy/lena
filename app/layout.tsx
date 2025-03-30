// app/layout.tsx (RootLayout)

import type { Metadata } from "next";
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
        {/* Sidebar on the left */}
        <CollapsibleSidebar />

        {/* The rest of the screen for the page’s main content */}
        <main className="flex-1 overflow-auto relative">
          {/* If you still want a global overlay or vignette, place it here or inside children 
          <div className="vignette-overlay pointer-events-none" />
          */}
          {children}
        </main>
      </body>
    </html>
  );
}
