"use client"

import { useState, useEffect } from "react"
import { preloadImage, isImagePreloaded } from "../utils/image-preloader"
import type { Memory } from "../types/types"

export function useMemoryImages(memories: Memory[], selectedIndex: number) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPreloading, setIsPreloading] = useState(false)

  const currentMemory = memories[selectedIndex]
  const currentImage = currentMemory?.image

  // Load the current image and preload others
  useEffect(() => {
    if (!memories.length || !currentImage) {
      setIsLoading(false)
      return
    }

    // Set loading state based on whether the current image is already preloaded
    setIsLoading(!isImagePreloaded(currentImage))

    // Load the current image first
    const loadCurrentImage = async () => {
      try {
        await preloadImage(currentImage)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load image:", error)
        setIsLoading(false)
      }
    }

    // Preload other images in the background
    const preloadOtherImages = async () => {
      setIsPreloading(true)

      try {
        // Get all other image URLs that need preloading
        const otherImages = memories
          .filter((mem, idx) => idx !== selectedIndex && mem.image)
          .map((mem) => mem.image as string)

        // Preload them in the background
        await Promise.all(otherImages.map((img) => preloadImage(img)))
      } catch (error) {
        console.error("Failed to preload images:", error)
      } finally {
        setIsPreloading(false)
      }
    }

    loadCurrentImage()
    preloadOtherImages()
  }, [memories, selectedIndex, currentImage])

  return { isLoading, isPreloading }
}
