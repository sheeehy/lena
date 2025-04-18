//context/memory-dialog-provider.tsx
"use client";
import { createContext, useState, useContext, type ReactNode } from "react";
import MemoryFormDialog from "../components/memory-form-dialog";

interface MemoryDialogContextType {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const MemoryDialogContext = createContext<MemoryDialogContextType | undefined>(undefined);

export function useMemoryDialog() {
  const context = useContext(MemoryDialogContext);
  if (!context) {
    throw new Error("useMemoryDialog must be used within a MemoryDialogProvider");
  }
  return context;
}

export function MemoryDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  return (
    <MemoryDialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
      {/* Render the dialog here so it's available globally */}
      <MemoryFormDialog />
    </MemoryDialogContext.Provider>
  );
}
