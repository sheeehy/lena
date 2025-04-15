"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import MemoryFormDialog from "./memory-form-dialog";

// Create a context to manage the dialog state
interface MemoryDialogContextType {
  openDialog: () => void;
  closeDialog: () => void;
  isOpen: boolean;
}

const MemoryDialogContext = createContext<MemoryDialogContextType>({
  openDialog: () => console.warn("Default openDialog called - context not properly initialized"),
  closeDialog: () => console.warn("Default closeDialog called - context not properly initialized"),
  isOpen: false,
});

// Hook to use the dialog context
export function useMemoryDialog() {
  const context = useContext(MemoryDialogContext);
  if (!context) {
    console.error("useMemoryDialog must be used within a MemoryDialogProvider");
    throw new Error("useMemoryDialog must be used within a MemoryDialogProvider");
  }
  return context;
}

// Provider component that includes the dialog
export function MemoryDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <MemoryDialogContext.Provider value={{ openDialog, closeDialog, isOpen }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <MemoryFormDialog onSuccess={closeDialog} />
      </Dialog>
    </MemoryDialogContext.Provider>
  );
}
