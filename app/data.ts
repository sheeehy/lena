// data.ts

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
}

export interface DayData {
  date: string;
  memories: Memory[];
}

const makeMemory = (
  date: string,
  image: string,
  title: string,
  description: string,
  location?: string
): Memory => ({
  id: image,
  date,
  title,
  description,
  type: "image",
  location,
});
