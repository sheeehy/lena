//types/user.ts
export interface UserProfile {
    id: string
    name: string
    email: string
    birthDate: string // ISO format: YYYY-MM-DD
    avatarUrl?: string
    createdAt: string
    updatedAt: string
  }
  