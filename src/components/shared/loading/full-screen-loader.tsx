"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/components/shared/loading/spinner";
import { APP_NAME } from "@/lib/constants";

interface FullScreenLoaderProps {
  label?: string;
}

export function FullScreenLoader({
  label = "Loading…",
}: FullScreenLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
    >
      <Spinner size="lg" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70">{APP_NAME}</p>
    </motion.div>
  );
}
