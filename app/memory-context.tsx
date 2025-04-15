"use client";

import type React from "react";
import { createContext, useContext, useEffect, useCallback, useReducer } from "react";
import { format, addDays } from "date-fns";
import type { DayData, Memory } from "./types";

// Add a reducer to ensure state updates are properly detected
type MemoryAction = { type: "SET_DAYS_DATA"; payload: DayData[] } | { type: "ADD_MEMORY"; payload: Memory } | { type: "SET_LOADING"; payload: boolean };

function memoryReducer(state: { daysData: DayData[]; isLoading: boolean; version: number }, action: MemoryAction) {
  switch (action.type) {
    case "SET_DAYS_DATA":
      return { ...state, daysData: action.payload, version: state.version + 1 };
    case "ADD_MEMORY": {
      const memory = action.payload;
      const dateStr = memory.date;

      // Find if we already have this date in our data
      const existingDayIndex = state.daysData.findIndex((day) => day.date === dateStr);

      if (existingDayIndex >= 0) {
        // Add to existing day
        const newDaysData = [...state.daysData];
        newDaysData[existingDayIndex] = {
          ...newDaysData[existingDayIndex],
          memories: [memory, ...newDaysData[existingDayIndex].memories],
        };

        console.log("🔄 State updated with new memory, new days count:", newDaysData.length);
        return { ...state, daysData: newDaysData, version: state.version + 1 };
      } else {
        // This shouldn't happen since we're creating all days, but just in case
        console.warn("Day not found in daysData array:", dateStr);
        return state;
      }
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface MemoryContextType {
  daysData: DayData[];
  refreshMemories: () => Promise<void>;
  isLoading: boolean;
  version: number; // Version counter to force re-renders
  addMemory: (memory: Memory) => void; // Direct method to add memory
}

// Create the context with a default value that matches the shape
const MemoryContext = createContext<MemoryContextType>({
  daysData: [],
  refreshMemories: async () => {},
  isLoading: true,
  version: 0,
  addMemory: () => {},
});

export function useMemories() {
  return useContext(MemoryContext);
}

// Helper function to create a full year of days
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
  // Use reducer instead of multiple useState calls
  const [state, dispatch] = useReducer(memoryReducer, {
    daysData: [],
    isLoading: true,
    version: 0,
  });

  // Direct method to add a memory to the state
  const addMemory = useCallback((memory: Memory) => {
    console.log("🔥 Adding memory directly via addMemory:", memory);
    dispatch({ type: "ADD_MEMORY", payload: memory });
  }, []);

  const fetchMemories = useCallback(async () => {
    console.log("🔄 Fetching memories...");
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
        refreshMemories: fetchMemories,
        isLoading: state.isLoading,
        version: state.version,
        addMemory,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}
