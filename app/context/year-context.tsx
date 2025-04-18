//context/year-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemories } from "./memory-context";

interface YearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  yearsWithMemories: string[];
  previousYear: string | null;
  nextYear: string | null;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function useYear() {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error("useYear must be used within a YearProvider");
  }
  return context;
}

export function YearProvider({ children }: { children: ReactNode }) {
  const { daysData, version } = useMemories();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [yearsWithMemories, setYearsWithMemories] = useState<string[]>([]);
  const [previousYear, setPreviousYear] = useState<string | null>(null);
  const [nextYear, setNextYear] = useState<string | null>(null);
  const pathname = usePathname();

  // Extract year from URL if available
  useEffect(() => {
    const match = pathname.match(/\/memories\/(\d{4})/);
    if (match && match[1]) {
      setSelectedYear(match[1]);
    }
  }, [pathname]);

  // Find years that have memories whenever daysData or version changes
  useEffect(() => {
    console.log("Updating years with memories, version:", version);
    const years = new Set<string>();

    daysData.forEach((day) => {
      if (day.memories.length > 0) {
        const year = day.date.split("-")[0];
        years.add(year);
      }
    });

    const yearsArray = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    console.log("Years with memories:", yearsArray);
    setYearsWithMemories(yearsArray);

    // Update previous and next years
    const currentIndex = yearsArray.indexOf(selectedYear);
    if (currentIndex !== -1) {
      setPreviousYear(yearsArray[currentIndex + 1] || null);
      setNextYear(yearsArray[currentIndex - 1] || null);
    } else {
      setPreviousYear(null);
      setNextYear(null);
    }
  }, [daysData, version, selectedYear]);

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        yearsWithMemories,
        previousYear,
        nextYear,
      }}
    >
      {children}
    </YearContext.Provider>
  );
}
