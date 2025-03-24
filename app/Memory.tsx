//memory.tsx
"use client";

import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import type { DayData, Memory } from "./data";
import MemoryFormDialog from "./memory-form-dialog";

interface MemoryProps {
  day: DayData;
  isSelected?: boolean; // We'll accept a prop that indicates if this day is the selected day
}

export default function Memory({ day, isSelected }: MemoryProps) {
  const containerWidth = 800;
  const squareSize = 400;

  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);
  const hasMemories = day.memories.length > 0;

  // Reset to first memory whenever day changes
  useEffect(() => {
    setSelectedMemoryIndex(0);
  }, [day]);

  const memory = day.memories[selectedMemoryIndex];

  return (
    <div className="relative" style={{ width: `${containerWidth}px` }}>
      {/* If we have memories, show the memory nav row */}
      {hasMemories && (
        <div
          className="flex space-x-3 text-white absolute z-10"
          style={{
            pointerEvents: "auto",
            left: `calc(50% - ${squareSize / 2}px)`,
            top: `calc(50% - ${squareSize / 2}px - 2rem)`,
          }}
        >
          {/* [1], [2], etc. */}
          {day.memories.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedMemoryIndex(idx)}
              className={`cursor-pointer transition-all duration-200 ease-out ${
                idx === selectedMemoryIndex ? "text-white opacity-100" : "text-zinc-500 opacity-80 hover:opacity-100"
              }`}
            >
              [{idx + 1}]
            </div>
          ))}

          {/* Show the plus icon if this day is selected */}
          {isSelected && (
            <div className="ml-2">
              <MemoryFormDialog />
            </div>
          )}
        </div>
      )}

      {/* The image bounding box */}
      <div
        className="pointer-events-none relative overflow-hidden"
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
        {memory?.type === "image" && <img src={memory.id} alt={memory.title} className="absolute inset-0 m-auto w-full h-full object-cover" />}
      </div>

      {/* Memory text info */}
      <div
        className="bg-black text-white p-4 flex flex-col justify-start pointer-events-none"
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
    </div>
  );
}
