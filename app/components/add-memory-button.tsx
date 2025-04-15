"use client";

import { Button } from "@/components/ui/button";
import { useMemoryDialog } from "../context/memory-dialog-provider";
import { PlusIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AddMemoryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  className?: string;
  children?: ReactNode;
}

export default function AddMemoryButton({ label, className = "bg-white text-black hover:bg-zinc-200", children, ...props }: AddMemoryButtonProps) {
  const { openDialog } = useMemoryDialog();

  return (
    <Button className={className} onClick={openDialog} {...props}>
      {children || (
        <>
          {label || "Add Memory"}
          <PlusIcon className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
