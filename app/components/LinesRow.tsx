//components/LinesRow.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import Lenis from "@studio-freight/lenis";
import Memory from "./Memory";
import { format } from "date-fns";
import { useMemories } from "@/app/context/memory-context";
import { useYear } from "@/app/context/year-context";
import type { DayData } from "../types/types";
import { stagger, useAnimate } from "framer-motion";

interface LinesRowProps {
  daysData?: DayData[];
  onAnimationComplete?: () => void;
}

const MEMORY_OFFSET_Y = "23rem";
const VISIBLE_DAYS_COUNT = 90; // Approximate number of days visible in viewport

export default function LinesRow({ daysData: propDaysData, onAnimationComplete }: LinesRowProps) {
  const { daysData: contextDaysData, isLoading, version } = useMemories();
  const { selectedYear } = useYear();
  const [scope, animate] = useAnimate();

  // Use provided daysData or filter from context by selected year
  const daysData = propDaysData || contextDaysData.filter((day) => day.date.startsWith(selectedYear)) || [];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [circleIndex, setCircleIndex] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const initialRenderRef = useRef(true);

  // For positioning the popup memory
  interface BarPosition {
    centerX: number;
  }
  const [barPositions, setBarPositions] = useState<BarPosition[] | null>(null);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Force measurement after data changes
  const [forceUpdate, setForceUpdate] = useState(0);

  // Run animation when component mounts or year changes
  useEffect(() => {
    // Reset selection when year changes
    setSelectedIndex(null);
    setCircleIndex(null);
    setAnimationComplete(false);
    setHasAnimated(false);

    // Scroll to the beginning of the year
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollLeft = 0;
    }

    // Animate the bars sequentially
    const animateBars = async () => {
      if (scope.current) {
        console.log("Starting animation sequence");

        // First, make sure all bars are invisible
        await animate("div.bar-container", { opacity: 0, y: 10 }, { duration: 0 });

        // Then animate them in sequentially
        await animate(
          "div.bar-container",
          { opacity: 1, y: 0 },
          {
            duration: 0.5,
            delay: stagger(0.01, { from: 0, ease: "easeOut" }),
            ease: [0.34, 1.56, 0.64, 1], // Spring-like effect
          }
        );

        setAnimationComplete(true);
        setHasAnimated(true);
        console.log("Animation sequence complete");

        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    // Start animation with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      animateBars();
    }, 300); // Increased delay for initial render

    return () => clearTimeout(timer);
  }, [animate, scope, selectedYear, onAnimationComplete]);

  // Ensure animation runs on initial render
  useEffect(() => {
    if (initialRenderRef.current && daysData.length > 0 && scope.current) {
      console.log("Initial render animation check");
      initialRenderRef.current = false;

      // Force animation to run again if it hasn't already
      const timer = setTimeout(() => {
        if (!hasAnimated) {
          console.log("Forcing animation on initial render");
          const animateBars = async () => {
            // First, make sure all bars are invisible
            await animate("div.bar-container", { opacity: 0, y: 10 }, { duration: 0 });

            // Then animate them in sequentially
            await animate(
              "div.bar-container",
              { opacity: 1, y: 0 },
              {
                duration: 0.5,
                delay: stagger(0.01, { from: 0, ease: "easeOut" }),
                ease: [0.34, 1.56, 0.64, 1], // Spring-like effect
              }
            );

            setAnimationComplete(true);
            setHasAnimated(true);
            console.log("Initial animation sequence complete");

            if (onAnimationComplete) {
              onAnimationComplete();
            }
          };

          animateBars();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [animate, daysData.length, hasAnimated, scope, onAnimationComplete]);

  // Debug
  useEffect(() => {
    console.log(`🔍 LinesRow rendering with ${daysData.length} days, version: ${version}, year: ${selectedYear}`);
    console.log(`Days with memories: ${daysData.filter((day) => day.memories.length > 0).length}`);
    console.log(`Animation complete: ${animationComplete}, Has animated: ${hasAnimated}`);
  }, [daysData, version, selectedYear, animationComplete, hasAnimated]);

  // Re-measure bars after small delay
  useEffect(() => {
    const timer = setTimeout(() => setForceUpdate((prev) => prev + 1), 50);
    return () => clearTimeout(timer);
  }, [daysData, version]);

  // Initialize Lenis for horizontal scroll
  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper || !wrapper.firstElementChild) return;

    // Destroy any existing instance
    if (lenisRef.current) {
      lenisRef.current.destroy();
    }

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

    // Also handle native wheel to redirect vertical scroll to horizontal
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        wrapper.scrollLeft += e.deltaY;
      }
    };
    wrapper.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      wrapper.removeEventListener("wheel", handleWheel);
      lenis.destroy();
    };
  }, [daysData.length]);

  // Measure bar positions
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current || daysData.length === 0) return;
    barRefs.current = barRefs.current.slice(0, daysData.length);

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const newPositions = barRefs.current.map((bar) => {
        if (!bar) return { centerX: 0 };
        const rect = bar.getBoundingClientRect();
        return { centerX: rect.left - containerRect.left + rect.width / 2 };
      });

      setBarPositions(newPositions);
    });
  }, [daysData, forceUpdate, version, animationComplete]);

  // Show the small circle with a delay
  useEffect(() => {
    if (selectedIndex === null) {
      setCircleIndex(null);
      return;
    }
    const timer = setTimeout(() => setCircleIndex(selectedIndex), 0);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  // Disable arrow-key scrolling if a dialog is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If there's an open dialog, skip
      const openDialog = document.querySelector("[role=dialog][data-state='open']");
      if (!scrollWrapperRef.current || openDialog) return;

      const scrollAmount = 100;
      if (e.key === "ArrowLeft") {
        scrollWrapperRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else if (e.key === "ArrowRight") {
        scrollWrapperRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (daysData.length === 0) {
    return <div className="fixed inset-0 flex items-center justify-center text-white">Loading memories...</div>;
  }

  // Determine the tallest bar
  const maxBarHeight = Math.max(...daysData.map((day) => day.memories.length * 25), 0);

  return (
    <div
      ref={scrollWrapperRef}
      className="fixed inset-0 flex items-end overflow-x-auto overflow-y-hidden px-16 pb-12 cursor-grab active:cursor-grabbing"
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div ref={containerRef} className="relative min-w-[4000px] ml-96 h-full overflow-visible">
        {barPositions && selectedIndex !== null && daysData[selectedIndex]?.memories.length > 0 && (
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

        <div ref={scope} className="absolute bottom-0 left-0 flex">
          {daysData.map((day, i) => {
            const isSelected = i === selectedIndex;
            const distance = Math.abs(i - hoveredIndex);
            const memoryCount = day.memories.length;
            const baseHeight = memoryCount > 0 ? memoryCount * 11 : 2;

            // Scale bars near hovered or selected
            const scaleFactor = isSelected ? (baseHeight > 0 ? (maxBarHeight * 0.7) / baseHeight : 1) : distance === 0 ? 1.4 : distance === 1 ? 1.2 : distance === 2 ? 1.1 : 1;

            // Colors
            let computedColor = "bg-zinc-800";
            if (isSelected || (distance === 0 && hoveredIndex === i)) computedColor = "bg-white";
            else if (distance === 1) computedColor = "bg-zinc-400";
            else if (distance === 2) computedColor = "bg-zinc-600";

            const actualHeight = baseHeight * scaleFactor;
            const showCircle = isSelected && memoryCount > 0;

            // Only animate the first VISIBLE_DAYS_COUNT days for performance
            const shouldAnimate = i < VISIBLE_DAYS_COUNT;

            return (
              <div
                key={`${day.date}-${i}-${version}`}
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                className={`relative flex items-end px-2 cursor-pointer overflow-visible bar-container`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => setSelectedIndex(isSelected ? null : i)}
                style={{
                  // Initially invisible
                  opacity: 0,
                  transform: "translateY(10px)",
                }}
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

                {isSelected && (
                  <div
                    className={`absolute text-white text-sm whitespace-nowrap transition-all duration-300 ease-in-out ${
                      circleIndex === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                    style={{
                      left: "50%",
                      bottom: "-32px",
                      transform: "translateX(-50%)",
                      zIndex: 9999,
                    }}
                  >
                    {format(new Date(day.date), "MMMM d")}
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
