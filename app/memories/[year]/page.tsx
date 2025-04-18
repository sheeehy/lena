//memories/[year]/page.tsx

"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import LinesRow from "../../components/LinesRow";
import { useMemories } from "../../context/memory-context";
import { useYear } from "../../context/year-context";
import { AnimatePresence } from "framer-motion";

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

export default function YearPage({ params }: PageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = React.use(params);
  const { year } = resolvedParams;

  const { daysData, version } = useMemories();
  const { setSelectedYear } = useYear();
  const [key, setKey] = useState(`linesrow-${year}-initial`);
  const [isChangingYear, setIsChangingYear] = useState(false);
  const [displayedYear, setDisplayedYear] = useState(year);

  // Update the selected year in context when the page loads
  useEffect(() => {
    console.log("Year page loaded with year:", year);
    setSelectedYear(year);
    setDisplayedYear(year);
  }, [year, setSelectedYear]);

  // Filter days data by the currently displayed year
  const filteredDaysData = daysData.filter((day) => {
    return day.date.startsWith(displayedYear);
  });

  // Handle year changes with animation
  useEffect(() => {
    if (displayedYear !== year) {
      // Year has changed, but we'll keep showing the old year until animation completes
      setIsChangingYear(true);
      // We'll update the displayed year after the exit animation completes
    }
  }, [year, displayedYear]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    console.log("Animation complete");
    if (isChangingYear) {
      // Now it's safe to update to the new year
      setDisplayedYear(year);
      setKey(`linesrow-${year}-${Date.now()}`);
      setIsChangingYear(false);
    }
  };

  // Debug log when filtered data changes
  useEffect(() => {
    console.log(`Filtered days for year ${displayedYear}:`, filteredDaysData.length);
    console.log(`Days with memories:`, filteredDaysData.filter((day) => day.memories.length > 0).length);
    console.log("Memory context version:", version);
    console.log("Is changing year:", isChangingYear);
    console.log("URL year:", year);
    console.log("Displayed year:", displayedYear);
  }, [filteredDaysData, displayedYear, version, isChangingYear, year]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black">
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        <LinesRow key={key} daysData={filteredDaysData} onAnimationComplete={handleAnimationComplete} />
      </AnimatePresence>
    </main>
  );
}
