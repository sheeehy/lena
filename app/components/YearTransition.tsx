"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface YearTransitionProps {
  children: ReactNode;
}

export default function YearTransition({ children }: YearTransitionProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full">
      {children}
    </motion.div>
  );
}
