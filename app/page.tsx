import { supabase } from "@/lib/supabase";
import LinesRow from "./LinesRow";
import { format } from "date-fns";

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
}

interface DayData {
  date: string;
  memories: Memory[];
}

export default async function HomePage() {
  const { data: dbMemories, error } = await supabase.from("memories").select("*").gte("date", "2025-01-01").lte("date", "2025-12-31");

  if (error) {
    console.error("Supabase fetch error:", error);
    return <div>Failed to load memories</div>;
  }

  const memoryMap: Record<string, Memory[]> = {};

  dbMemories?.forEach((mem) => {
    // e.g. "2025-03-01T00:00:00.000Z" => "2025-03-01"
    const dayString = format(new Date(mem.date), "yyyy-MM-dd");
    if (!memoryMap[dayString]) {
      memoryMap[dayString] = [];
    }
    memoryMap[dayString].push(mem);
  });

  const daysInYear: DayData[] = [];
  const startOfYear = new Date("2025-01-01");
  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startOfYear);
    currentDate.setDate(startOfYear.getDate() + i);

    const dayKey = format(currentDate, "yyyy-MM-dd");
    const memoriesForDay = memoryMap[dayKey] || [];

    daysInYear.push({
      date: dayKey,
      memories: memoriesForDay,
    });
  }

  return <LinesRow daysData={daysInYear} />;
}
