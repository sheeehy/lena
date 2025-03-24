// app/LinesRow.tsx (or wherever it's defined)
"use client"; // It's a client component

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Lenis from "@studio-freight/lenis";
import Memory from "./Memory";

export interface Memory {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "image";
  location?: string;
}

interface DayData {
  date: string;
  memories: Memory[];
}

interface LinesRowProps {
  daysData: DayData[]; // 365 elements
}

const MEMORY_OFFSET_Y = "23rem";

export default function LinesRow({ daysData }: LinesRowProps) {
  const TOTAL_DAYS = daysData.length; // should be 365
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [circleIndex, setCircleIndex] = useState<number | null>(null);

  // for measuring bar positions
  interface BarPosition {
    centerX: number;
  }
  const [barPositions, setBarPositions] = useState<BarPosition[] | null>(null);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1) Initialize Lenis scroller
  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper || !wrapper.firstElementChild) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement,
      orientation: "horizontal",
      duration: 3.0,
      wheelMultiplier: 1.0,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // 2) Measure bar positions once rendered
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newPositions = barRefs.current.map((bar) => {
      if (!bar) return { centerX: 0 };
      const rect = bar.getBoundingClientRect();
      const centerX = rect.left - containerRect.left + rect.width / 2;
      return { centerX };
    });

    setBarPositions(newPositions);
  }, [daysData]);

  // 3) Show circle after a small delay
  useEffect(() => {
    if (selectedIndex === null) {
      setCircleIndex(null);
      return;
    }
    const timer = setTimeout(() => setCircleIndex(selectedIndex), 0);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  // 4) figure out max bar height (like your old logic)
  const maxBarHeight = Math.max(...daysData.map((day) => day.memories.length * 25));

  return (
    <div ref={scrollWrapperRef} className="fixed inset-0 flex items-end overflow-x-auto overflow-y-hidden px-16 pb-12">
      {/* Vignette etc. if you want */}
      <div ref={containerRef} className="relative min-w-[4000px] ml-96 h-full overflow-visible">
        {/* Memory Display */}
        {barPositions && selectedIndex !== null && daysData[selectedIndex].memories.length > 0 && (
          <div
            className="absolute transition-opacity duration-300 opacity-100"
            style={{
              pointerEvents: "none",
              zIndex: 999,
              left: barPositions[selectedIndex].centerX,
              bottom: MEMORY_OFFSET_Y,
              transform: "translateX(-50%)",
            }}
          >
            <Memory day={daysData[selectedIndex]} isSelected />
          </div>
        )}

        {/* Bars */}
        <div className="absolute bottom-0 left-0 flex">
          {daysData.map((day, i) => {
            const isSelected = i === selectedIndex;
            const distance = Math.abs(i - hoveredIndex);
            const memoryCount = day.memories.length;
            const baseHeight = memoryCount > 0 ? memoryCount * 11 : 2;

            const scaleFactor = isSelected ? (baseHeight > 0 ? (maxBarHeight * 0.7) / baseHeight : 1) : distance === 0 ? 1.4 : distance === 1 ? 1.2 : distance === 2 ? 1.1 : 1;

            let computedColor = "bg-zinc-800";
            if (isSelected || (distance === 0 && hoveredIndex === i)) {
              computedColor = "bg-white";
            } else if (distance === 1) {
              computedColor = "bg-zinc-400";
            } else if (distance === 2) {
              computedColor = "bg-zinc-600";
            }

            const actualHeight = baseHeight * scaleFactor;
            const showCircle = isSelected && memoryCount > 0;

            return (
              <div
                key={i}
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => setSelectedIndex(isSelected ? null : i)}
                className="relative flex items-end px-2 cursor-pointer overflow-visible"
              >
                <div
                  className={`w-[2px] min-w-[2px] flex-shrink-0 origin-bottom transition-transform duration-200 ease-in-out ${isSelected ? "z-10" : ""} ${computedColor}`}
                  style={{
                    height: `${baseHeight}px`,
                    transform: `translateZ(0) scaleX(1) scaleY(${scaleFactor})`,
                  }}
                />
                {showCircle && (
                  <div
                    className={`absolute bg-white rounded-full transition-opacity duration-300 ease-in ${circleIndex === i ? "opacity-100" : "opacity-0"}`}
                    style={{
                      width: "8px",
                      height: "8px",
                      left: "50%",
                      bottom: `${actualHeight}px`,
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
