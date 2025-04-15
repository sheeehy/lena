/**
 * Utility for preloading images
 */

// Cache of preloaded images
const preloadedImages: Record<string, boolean> = {}

/**
 * Preload an image and return a promise that resolves when the image is loaded
 */
export function preloadImage(src: string): Promise<void> {
  // If already preloaded, return resolved promise
  if (preloadedImages[src]) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      preloadedImages[src] = true
      resolve()
    }
    img.onerror = reject
  })
}

/**
 * Preload multiple images and return a promise that resolves when all images are loaded
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map((src) => preloadImage(src)))
}

/**
 * Check if an image has been preloaded
 */
export function isImagePreloaded(src: string): boolean {
  return !!preloadedImages[src]
}
