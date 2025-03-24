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

export const daysData: DayData[] = [
  {
    date: "2025-03-01",
    memories: [
      makeMemory(
        "2025-03-01",
        "https://i.pinimg.com/474x/70/72/79/707279871895aae7361b6dfe1adf0700.jpg",
        "Morning Hike",
        "A crisp morning walk through the dense fog, watching the sun slowly rise over the valley.",
        "Wicklow Mountains"
      ),
    ],
  },
  {
    date: "2025-03-02",
    memories: [
      makeMemory(
        "2025-03-02",
        "https://i.pinimg.com/474x/6d/cc/da/6dccda4418fd846a8f7d09da41bdccce.jpg",
        "City Exploration",
        "Wandered the city streets late at night, neon lights reflecting off the wet pavement.",
        "Seoul"
      ),
    ],
  },
];
