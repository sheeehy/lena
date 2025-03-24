import { supabase } from "@/lib/supabase";
import LinesRow from "./LinesRow"; // Your timeline component
import { format } from "date-fns";

// Example memory shape
export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
}

// We'll transform DB data into an array of DayData
interface DayData {
  date: string; // e.g. "2025-03-01"
  memories: Memory[]; // array of memories for that day
}

export default async function HomePage() {
  // 1) Fetch memories for 2025 from your "memories" table
  //    If your date column is date or timestamp, you can do a range filter:
  const { data: dbMemories, error } = await supabase.from("memories").select("*").gte("date", "2025-01-01").lte("date", "2025-12-31"); // or no filters if your table only has 2025 data

  if (error) {
    console.error("Supabase fetch error:", error);
    // In a real app, handle gracefully (show an error message)
    return <div>Failed to load memories</div>;
  }

  // 2) Create a dictionary of date => Memory[]
  //    This helps us quickly see which days have memories
  const memoryMap: Record<string, Memory[]> = {};

  dbMemories?.forEach((mem) => {
    // If date is type date, Supabase might return "2025-03-01T00:00:00.000Z"
    // We'll parse it and re-format to "YYYY-MM-DD"
    const dayString = format(new Date(mem.date), "yyyy-MM-dd");
    if (!memoryMap[dayString]) {
      memoryMap[dayString] = [];
    }
    memoryMap[dayString].push(mem);
  });

  // 3) Build an array of 365 days for 2025
  //    Each element is { date: "2025-03-01", memories: Memory[] }
  const daysInYear: DayData[] = [];
  const startOfYear = new Date("2025-01-01");
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startOfYear);
    currentDate.setDate(startOfYear.getDate() + i);

    const dayKey = format(currentDate, "yyyy-MM-dd"); // e.g. "2025-01-01"
    const memoriesForDay = memoryMap[dayKey] || [];

    daysInYear.push({
      date: dayKey,
      memories: memoriesForDay,
    });
  }

  // 4) Pass daysInYear to your LinesRow component
  return <LinesRow daysData={daysInYear} />;
}
