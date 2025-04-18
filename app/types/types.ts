//types/types.ts
// Shared types for the memory timeline application
export interface Memory {
    id: string
    date: string
    title: string
    description: string
    type?: "image"
    location?: string
    image?: string
  }
  
  export interface DayData {
    date: string
    memories: Memory[]
  }
  