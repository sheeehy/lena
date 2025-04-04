// CollapsibleSidebar.tsx

"use client";
import * as React from "react";
import { Calendar, ChevronDown, LogOut, Search, Settings, User, ArrowDownUp, Plus } from "lucide-react";
import MemoryFormDialog from "./memory-form-dialog";

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = React.useState(true);
  const [selectedYear, setSelectedYear] = React.useState("2025");
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [yearsOpen, setYearsOpen] = React.useState(false);
  const years = ["2025", "2024", "2023", "2022", "2021"];
  const [textVisible, setTextVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCollapsed(false);
    setTimeout(() => setTextVisible(true), 10);
  };

  const handleMouseLeave = () => {
    setTextVisible(false);
    timeoutRef.current = setTimeout(() => {
      setCollapsed(true);
      setProfileOpen(false);
      setYearsOpen(false);
    }, 50);
  };

  return (
    <div className="relative my-4 pl-2 z-50" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className={`h-full  bg-zinc-950 rounded-2xl text-zinc-400 transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-64"} flex flex-col overflow-hidden`}>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                if (!collapsed) setProfileOpen(!profileOpen);
              }}
              className="flex cursor-pointer items-center gap-3 transition-all duration-300 ease-in-out"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-black flex-shrink-0">
                <img
                  src="https://media.licdn.com/dms/image/v2/D5603AQGBCvgNJwvCwg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1701202936674?e=1748476800&v=beta&t=PHYo-IRm_-0eaFRS1M4KZ1iBtr1gn4G-ToKc6U32B2I"
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
                  textVisible ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                } overflow-hidden whitespace-nowrap`}
              >
                <div className="flex-1 overflow-hidden text-ellipsis">
                  <p className="text-sm text-white">Jack Sheehy</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
          </div>

          {profileOpen && !collapsed && (
            <div className="absolute left-4 right-4 z-[100] mt-4 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150 ease-out">
              <div className="rounded-md bg-black py-1 shadow-lg">
                <button className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
                  <ArrowDownUp className="h-4 w-4" />
                  <span>Switch Account</span>
                </button>
                <button className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2">
          <button
            className={`cursor-pointer flex items-center rounded-md bg-zinc-950 text-zinc-400 transition-all duration-100 ease-in-out hover:bg-zinc-900 hover:text-white ${
              collapsed ? "w-8 h-8" : "w-full h-8 "
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
              <Search className="h-4 w-4" />
            </div>
            <span
              className={`text-sm text-left whitespace-nowrap transition-all duration-100 ease-in-out ${
                textVisible ? "opacity-100 max-w-[200px] ml-1" : "opacity-0 max-w-0 ml-0"
              } overflow-hidden`}
            >
              Search...
            </span>
          </button>
        </div>

        <div className="px-4 py-2">
          <MemoryFormDialog
            trigger={
              <button
                className={`cursor-pointer flex items-center rounded-md bg-zinc-950 text-zinc-400 transition-all duration-100 ease-in-out hover:bg-zinc-900 hover:text-white ${
                  collapsed ? "w-8 h-8" : "w-full h-8 "
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm text-left whitespace-nowrap transition-all duration-100 ease-in-out ${
                    textVisible ? "opacity-100 max-w-[200px] ml-1" : "opacity-0 max-w-0 ml-0"
                  } overflow-hidden`}
                >
                  Add Memory
                </span>
              </button>
            }
          />
        </div>

        <div className="px-4 py-2">
          <div className="relative">
            <button
              onClick={() => {
                if (!collapsed) setYearsOpen(!yearsOpen);
              }}
              className={`cursor-pointer flex items-center rounded-md bg-zinc-950 text-zinc-400 transition-all duration-100 ease-in-out hover:bg-zinc-900 hover:text-white ${
                collapsed ? "w-8 h-8" : "w-full h-8 "
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div
                className={`flex flex-1 items-center justify-between transition-all duration-100 ease-in-out ${
                  textVisible ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                } overflow-hidden`}
              >
                <span className="text-sm text-left whitespace-nowrap ml-1">{selectedYear}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-100 ${yearsOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {yearsOpen && !collapsed && (
              <div className="absolute left-0 right-0 z-[100] mt-1 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150 ease-out">
                <div className="rounded-md bg-black py-1 shadow-lg">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setYearsOpen(false);
                      }}
                      className={`cursor-pointer flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-zinc-900 ${
                        selectedYear === year ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex-1 px-2">{/* Add nav items here */}</div>
      </div>
    </div>
  );
}
