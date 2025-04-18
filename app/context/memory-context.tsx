//context/memory-context.tsx

"use client";

import type React from "react";
import { createContext, useContext, useEffect, useCallback, useReducer } from "react";
import { format, addDays } from "date-fns";
import type { DayData, Memory } from "../types/types";

// Add a reducer to ensure state updates are properly detected
type MemoryAction =
  | { type: "SET_DAYS_DATA"; payload: DayData[] }
  | { type: "ADD_MEMORY"; payload: Memory }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_YEAR_DATA"; payload: { year: string; data: DayData[] } };

function memoryReducer(
  state: {
    daysData: DayData[];
    isLoading: boolean;
    version: number;
    yearDataCache: Record<string, DayData[]>;
  },
  action: MemoryAction
) {
  switch (action.type) {
    case "SET_DAYS_DATA":
      return { ...state, daysData: action.payload, version: state.version + 1 };
    case "ADD_MEMORY": {
      const memory = action.payload;
      const dateStr = memory.date;
      const year = dateStr.split("-")[0];

      // Find if we already have this date in our data
      const existingDayIndex = state.daysData.findIndex((day) => day.date === dateStr);

      // Create updated daysData
      let newDaysData = [...state.daysData];
      if (existingDayIndex >= 0) {
        // Add to existing day
        newDaysData[existingDayIndex] = {
          ...newDaysData[existingDayIndex],
          memories: [memory, ...newDaysData[existingDayIndex].memories],
        };
      } else {
        // This shouldn't happen since we're creating all days, but just in case
        console.warn("Day not found in daysData array:", dateStr);
      }

      // Update year cache if it exists
      let newYearDataCache = { ...state.yearDataCache };
      if (state.yearDataCache[year]) {
        const yearData = [...state.yearDataCache[year]];
        const yearDayIndex = yearData.findIndex((day) => day.date === dateStr);

        if (yearDayIndex >= 0) {
          yearData[yearDayIndex] = {
            ...yearData[yearDayIndex],
            memories: [memory, ...yearData[yearDayIndex].memories],
          };
          newYearDataCache[year] = yearData;
        }
      }

      console.log("🔄 State updated with new memory, new days count:", newDaysData.length);
      return {
        ...state,
        daysData: newDaysData,
        yearDataCache: newYearDataCache,
        version: state.version + 1,
      };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_YEAR_DATA":
      return {
        ...state,
        yearDataCache: {
          ...state.yearDataCache,
          [action.payload.year]: action.payload.data,
        },
        version: state.version + 1,
      };
    default:
      return state;
  }
}

interface MemoryContextType {
  daysData: DayData[];
  yearDataCache: Record<string, DayData[]>;
  refreshMemories: () => Promise<void>;
  fetchYearData: (year: string) => Promise<void>;
  isLoading: boolean;
  version: number;
  addMemory: (memory: Memory) => void;
}

// Create the context with updated default values
const MemoryContext = createContext<MemoryContextType>({
  daysData: [],
  yearDataCache: {},
  refreshMemories: async () => {},
  fetchYearData: async () => {},
  isLoading: true,
  version: 0,
  addMemory: () => {},
});

export function useMemories() {
  return useContext(MemoryContext);
}

// Helper function to create days for a specific year
function createYearDays(year: string, memories: Memory[]): DayData[] {
  // Filter memories for this year
  const yearMemories = memories.filter((memory) => memory.date.startsWith(year));

  // Create a map of memories by date
  const memoryMap: Record<string, Memory[]> = {};
  yearMemories.forEach((memory) => {
    if (!memoryMap[memory.date]) {
      memoryMap[memory.date] = [];
    }
    memoryMap[memory.date].push(memory);
  });

  // Create days for this year
  const daysInYear: DayData[] = [];
  const startOfYear = new Date(`${year}-01-01`);
  const daysInYearCount = parseInt(year) % 4 === 0 ? 366 : 365; // Account for leap years

  for (let i = 0; i < daysInYearCount; i++) {
    const currentDate = addDays(startOfYear, i);
    const dayKey = format(currentDate, "yyyy-MM-dd");
    const memoriesForDay = memoryMap[dayKey] || [];

    daysInYear.push({
      date: dayKey,
      memories: memoriesForDay,
    });
  }

  return daysInYear;
}

// Helper function to create a full year of days (keep existing function)
function createFullYearDays(memories: Memory[]): DayData[] {
  // Create a map of memories by date
  const memoryMap: Record<string, Memory[]> = {};

  memories.forEach((memory) => {
    if (!memoryMap[memory.date]) {
      memoryMap[memory.date] = [];
    }
    memoryMap[memory.date].push(memory);
  });

  // Create an array for all days in multiple years (2003 to current year)
  const daysInYears: DayData[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = 2003; // Birth year

  for (let year = startYear; year <= currentYear; year++) {
    const startOfYear = new Date(`${year}-01-01`);
    const daysInYear = year % 4 === 0 ? 366 : 365; // Account for leap years

    for (let i = 0; i < daysInYear; i++) {
      const currentDate = addDays(startOfYear, i);
      const dayKey = format(currentDate, "yyyy-MM-dd");
      const memoriesForDay = memoryMap[dayKey] || [];

      daysInYears.push({
        date: dayKey,
        memories: memoriesForDay,
      });
    }
  }

  return daysInYears;
}

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  // Use reducer with updated state structure
  const [state, dispatch] = useReducer(memoryReducer, {
    daysData: [],
    isLoading: true,
    version: 0,
    yearDataCache: {},
  });

  // Direct method to add a memory to the state
  const addMemory = useCallback((memory: Memory) => {
    console.log("🔥 Adding memory directly via addMemory:", memory);
    dispatch({ type: "ADD_MEMORY", payload: memory });
  }, []);

  // Fetch all memories (keep existing function)
  const fetchMemories = useCallback(async () => {
    console.log("🔄 Fetching all memories...");
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch("/api/memories");
      if (!response.ok) {
        console.error(`API returned status: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch memories: ${response.status} ${response.statusText}`);
      }

      const memories: Memory[] = await response.json();
      console.log(`✅ Fetched ${memories.length} memories`);

      // Create days for all years with the fetched memories
      const allDays = createFullYearDays(memories);

      dispatch({ type: "SET_DAYS_DATA", payload: allDays });
    } catch (error: any) {
      console.error("Error fetching memories:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // New function to fetch data for a specific year
  const fetchYearData = useCallback(
    async (year: string) => {
      // If we already have this year's data cached, use it
      if (state.yearDataCache[year]) {
        console.log(`Using cached data for year ${year}`);
        return;
      }

      console.log(`🔄 Fetching memories for year ${year}...`);
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await fetch("/api/memories");
        if (!response.ok) {
          console.error(`API returned status: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch memories: ${response.status} ${response.statusText}`);
        }

        const memories: Memory[] = await response.json();
        console.log(`✅ Fetched ${memories.length} memories for year ${year}`);

        // Create days for this specific year
        const yearDays = createYearDays(year, memories);

        // Cache the year data
        dispatch({ type: "SET_YEAR_DATA", payload: { year, data: yearDays } });

        // Also update the current daysData if it's empty
        if (state.daysData.length === 0) {
          dispatch({ type: "SET_DAYS_DATA", payload: yearDays });
        }
      } catch (error: any) {
        console.error(`Error fetching memories for year ${year}:`, error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.yearDataCache, state.daysData.length]
  );

  // Initial fetch
  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Listen for memory added events
  useEffect(() => {
    const handleMemoryAdded = (event: CustomEvent<Memory>) => {
      console.log("🎉 Memory added event received!", event.detail);

      // Add the memory directly to state for instant updates
      if (event.detail) {
        addMemory(event.detail as Memory);
      }
    };

    // Use a more specific event name to avoid conflicts
    window.addEventListener("memoryAdded", handleMemoryAdded as EventListener);

    return () => {
      window.removeEventListener("memoryAdded", handleMemoryAdded as EventListener);
    };
  }, [addMemory]);

  return (
    <MemoryContext.Provider
      value={{
        daysData: state.daysData,
        yearDataCache: state.yearDataCache,
        refreshMemories: fetchMemories,
        fetchYearData,
        isLoading: state.isLoading,
        version: state.version,
        addMemory,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}
