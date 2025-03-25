// data.ts

export interface Memory {
  id: string;       // primary key or any ID
  date: string;     // e.g. "2025-03-01"
  title: string;
  description: string;
  type: "image";    // or another type if you'd like
  location?: string;
  image?: string;   // <-- new field for the image URL
}

export interface DayData {
  date: string;
  memories: Memory[];
}

