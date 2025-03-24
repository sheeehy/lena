//page.tsx
"use client";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { daysData } from "./data";
import Memory from "./Memory";

interface BarPosition {
  centerX: number;
}

const MEMORY_OFFSET_Y = "23rem";
const TOTAL_DAYS = 365;

export default function LinesRow() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [barPositions, setBarPositions] = useState<BarPosition[] | null>(null);
  const [circleIndex, setCircleIndex] = useState<number | null>(null);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const allDays = Array.from({ length: TOTAL_DAYS }).map((_, i) => {
    return (
      daysData[i] ?? {
        date: `2025-${(i % 12) + 1}-${(i % 28) + 1}`,
        memories: [],
      }
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const maxBarHeight = Math.max(...allDays.map((day) => day.memories.length * 25));

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
  }, [allDays.length]);

  useEffect(() => {
    if (selectedIndex === null) {
      setCircleIndex(null);
      return;
    }
    const timer = setTimeout(() => {
      setCircleIndex(selectedIndex);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const selectedDay = selectedIndex !== null && allDays[selectedIndex] ? allDays[selectedIndex] : null;

  const hasValidMemories = selectedDay && selectedDay.memories.length > 0;

  return (
    <div ref={scrollWrapperRef} className="fixed inset-0 flex items-end overflow-x-auto overflow-y-hidden px-16 pb-12">
      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none z-[9999]">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0.8) 100%)",
          }}
        />
      </div>

      <div ref={containerRef} className="relative min-w-[4000px] ml-96 h-full overflow-visible">
        {barPositions && selectedIndex !== null && allDays[selectedIndex].memories.length > 0 && (
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
            <Memory day={allDays[selectedIndex]} isSelected /> {/* Pass isSelected */}
          </div>
        )}

        {/* Bars */}
        <div className="absolute bottom-0 left-0 flex">
          {allDays.map((day, i) => {
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

            const showDateLabel = isSelected;
            const showCircle = isSelected && memoryCount > 0;
            const actualHeight = baseHeight * scaleFactor;

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
                {showDateLabel && (
                  <div
                    className={`absolute text-white text-sm whitespace-nowrap transition-all duration-300 ease-in-out ${
                      circleIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                    style={{
                      left: "50%",
                      bottom: `-${32}px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {formatDate(day.date)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
