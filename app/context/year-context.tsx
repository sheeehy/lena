"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useMemories } from "./memory-context";

interface YearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  yearsWithMemories: string[];
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
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [yearsWithMemories, setYearsWithMemories] = useState<string[]>([]);

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

    const yearsArray = Array.from(years);
    console.log("Years with memories:", yearsArray);
    setYearsWithMemories(yearsArray);
  }, [daysData, version]);

  return <YearContext.Provider value={{ selectedYear, setSelectedYear, yearsWithMemories }}>{children}</YearContext.Provider>;
}
