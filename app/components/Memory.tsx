"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import type { DayData } from "../types/types";
import { useMemoryDialog } from "@/app/context/memory-dialog-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface MemoryProps {
  day: DayData;
  isSelected?: boolean;
  // Animation configuration props with defaults
  animationStaggerDelay?: number;
  animationStiffness?: number;
  animationDamping?: number;
}

export default function Memory({
  day,
  isSelected,
  // Default animation values that can be overridden
  animationStaggerDelay = 0.02,
  animationStiffness = 400,
  animationDamping = 20,
}: MemoryProps) {
  const { openDialog } = useMemoryDialog();
  const containerWidth = 800;
  const squareSize = 400;
  const [open, setOpen] = useState(false);

  // Use state but with no transitions or effects
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset index when day changes - only essential effect
  useEffect(() => {
    setSelectedMemoryIndex(0);
  }, [day]);

  const hasMemories = day.memories.length > 0;
  const memory = hasMemories ? day.memories[selectedMemoryIndex] : null;

  // Animation variants with configurable parameters
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: animationStiffness,
        damping: animationDamping,
        staggerChildren: animationStaggerDelay,
        delayChildren: 0.01,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -5,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: animationStiffness,
        damping: animationDamping,
      },
    },
  };

  // Extremely simplified render with no animations, transitions, or complex logic
  return (
    <div className="relative bg-transparent" style={{ width: `${containerWidth}px` }}>
      {hasMemories && (
        <>
          <div
            className="flex justify-between absolute z-10 w-full"
            style={{
              pointerEvents: "auto",
              left: `calc(50% - ${squareSize / 2}px)`,
              top: `calc(50% - ${squareSize / 2}px - 2rem)`,
              width: `${squareSize}px`,
            }}
          >
            <div className="flex space-x-3 text-white">
              {day.memories.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMemoryIndex(idx)}
                  className={`cursor-pointer ${idx === selectedMemoryIndex ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {isSelected && (
              <div className="flex space-x-2">
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-zinc-600 hover:text-white flex items-center" aria-label="Memory options">
                      <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                    </button>
                  </DropdownMenuTrigger>

                  <AnimatePresence>
                    {open && (
                      <DropdownMenuContent forceMount align="end" className="bg-zinc-900 border-zinc-800 text-white p-2 z-50 rounded-3xl" asChild sideOffset={5}>
                        <motion.div initial="hidden" animate="visible" exit="exit" variants={dropdownVariants} className="z-50" style={{ pointerEvents: "auto" }}>
                          {/* Using custom divs instead of MotionDropdownMenuItem for better hover handling */}
                          <motion.div
                            variants={itemVariants}
                            className="relative flex cursor-pointer select-none items-center rounded-full px-4 py-2 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 z-50"
                            onClick={() => {
                              console.log("Edit memory");
                              setOpen(false);
                            }}
                            whileHover={{ backgroundColor: "rgba(39, 39, 42, 1)" }}
                            style={{ pointerEvents: "auto" }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit memory</span>
                          </motion.div>

                          <motion.div
                            variants={itemVariants}
                            className="relative flex cursor-pointer select-none items-center rounded-full px-4 py-2 text-sm outline-none transition-colors hover:bg-zinc-800 focus:bg-zinc-800 text-red-500 z-50"
                            onClick={() => {
                              console.log("Delete memory");
                              setOpen(false);
                            }}
                            whileHover={{ backgroundColor: "rgba(39, 39, 42, 1)" }}
                            style={{ pointerEvents: "auto" }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete memory</span>
                          </motion.div>
                        </motion.div>
                      </DropdownMenuContent>
                    )}
                  </AnimatePresence>
                </DropdownMenu>

                <button onClick={openDialog} className="text-zinc-600 hover:text-white flex items-center" aria-label="Add new memory">
                  <Plus className="h-4 w-4 cursor-pointer" />
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              transform: "translate(-50%, -50%)",
              backgroundColor: "#333",
            }}
          >
            {memory?.image ? (
              <div className="relative w-full h-full">
                <Image
                  src={memory.image || "/placeholder.svg"}
                  alt={memory.title || "Memory image"}
                  fill
                  sizes="400px"
                  priority={true}
                  className="object-cover"
                  quality={85}
                  onLoadingComplete={() => setImageLoading(false)}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 transition-opacity duration-300"
                  style={{
                    opacity: imageLoading ? 1 : 0,
                    pointerEvents: imageLoading ? "auto" : "none",
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <div className="w-10 h-10 border-t-2 border-b-2 border-white rounded-full" />
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 flex items-center justify-center h-full w-full">No image</div>
            )}
          </div>

          <div
            className="bg-black text-white p-4 flex flex-col justify-start"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${containerWidth - squareSize - 12}px`,
              transform: `translateY(-50%) translateX(${squareSize / 2 + 12}px)`,
            }}
          >
            <h2 className="text-xl mb-2">{memory?.title}</h2>
            <p className="text-zinc-500 mb-1">{memory?.description}</p>
            {memory?.location && (
              <div className="text-zinc-600 text-xs mt-2 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {memory.location}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
