"use client";

import { useEffect, useState } from "react";
import LinesRow from "./LinesRow";
import { useMemories } from "./memory-context";
import { useYear } from "./year-context";

export default function Home() {
  const { daysData, version } = useMemories();
  const { selectedYear } = useYear();
  const [key, setKey] = useState(`linesrow-${selectedYear}-initial`);

  // Filter days data by selected year
  const filteredDaysData = daysData.filter((day) => {
    return day.date.startsWith(selectedYear);
  });

  // Update key when year changes to force remount
  useEffect(() => {
    setKey(`linesrow-${selectedYear}-${Date.now()}`);
  }, [selectedYear]);

  // Debug log when filtered data changes
  useEffect(() => {
    console.log(`Filtered days for year ${selectedYear}:`, filteredDaysData.length);
    console.log(`Days with memories:`, filteredDaysData.filter((day) => day.memories.length > 0).length);
    console.log("Memory context version:", version);
  }, [filteredDaysData, selectedYear, version]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black">
      <LinesRow key={key} daysData={filteredDaysData} />
    </main>
  );
}
