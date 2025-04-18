//components/Memory.tsx

"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus } from "lucide-react";
import Image from "next/image";
import type { DayData } from "../types/types";
import { useMemoryDialog } from "@/app/context/memory-dialog-provider";

interface MemoryProps {
  day: DayData;
  isSelected?: boolean;
}

export default function Memory({ day, isSelected }: MemoryProps) {
  const { openDialog } = useMemoryDialog();
  const containerWidth = 800;
  const squareSize = 400;

  // Use state but with no transitions or effects
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);

  // Reset index when day changes - only essential effect
  useEffect(() => {
    setSelectedMemoryIndex(0);
  }, [day]);

  const hasMemories = day.memories.length > 0;
  const memory = hasMemories ? day.memories[selectedMemoryIndex] : null;

  // Extremely simplified render with no animations, transitions, or complex logic
  return (
    <div className="relative bg-transparent" style={{ width: `${containerWidth}px` }}>
      {hasMemories && (
        <>
          <div
            className="flex space-x-3 text-white absolute z-10"
            style={{
              pointerEvents: "auto",
              left: `calc(50% - ${squareSize / 2}px)`,
              top: `calc(50% - ${squareSize / 2}px - 2rem)`,
            }}
          >
            {day.memories.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMemoryIndex(idx)}
                className={`cursor-pointer ${idx === selectedMemoryIndex ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {idx + 1}
              </div>
            ))}

            {isSelected && (
              <div className="ml-2">
                <button onClick={openDialog} className="text-zinc-600 hover:text-white flex items-center">
                  <Plus className="h-4 w-4 cursor-pointer mt-1" />
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
                <Image src={memory.image || "/placeholder.svg"} alt={memory.title || "Memory image"} fill sizes="400px" priority={true} className="object-cover" quality={85} />
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
