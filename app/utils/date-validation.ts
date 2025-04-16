/**
 * Validates if a date is after the user's birth date
 * @param dateToCheck The date to validate (ISO string or Date object)
 * @param birthDate The user's birth date (ISO string or Date object)
 * @returns An object with validation result and error message if applicable
 */
export function validateMemoryDate(
    dateToCheck: string | Date,
    birthDate: string | Date,
  ): { isValid: boolean; errorMessage?: string } {
    const memoryDate = dateToCheck instanceof Date ? dateToCheck : new Date(dateToCheck)
    const userBirthDate = birthDate instanceof Date ? birthDate : new Date(birthDate)
  
    // Check if the memory date is valid
    if (isNaN(memoryDate.getTime())) {
      return { isValid: false, errorMessage: "Invalid date format" }
    }
  
    // Check if the memory date is after the birth date
    if (memoryDate < userBirthDate) {
      return {
        isValid: false,
        errorMessage: `Memory date cannot be before your birthday`,
      }
    }
  
    // Check if the memory date is in the future
    const today = new Date()
    if (memoryDate > today) {
      return {
        isValid: false,
        errorMessage: "Memory date cannot be in the future",
      }
    }
  
    return { isValid: true }
  }
  