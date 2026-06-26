"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

interface QuickLogPanelProps {
  onSuccess: () => void;
}

export default function QuickLogPanel({ onSuccess }: QuickLogPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [pain, setPain] = useState([3]);
  const [stress, setStress] = useState([3]);
  const [stoolFreq, setStoolFreq] = useState([2]);
  const [isLogging, setIsLogging] = useState(false);

  const handleLog = async () => {
    setIsLogging(true);
    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          painLevel: pain[0],
          stressLevel: stress[0],
          stoolFrequency: stoolFreq[0],
          stoolType: 4,
          triggers: [],
          bloodInStool: false,
          urgencyLevel: 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to log");
      toast.success("Quick log saved! ✅");
      setPain([3]);
      setStress([3]);
      setStoolFreq([2]);
      setExpanded(false);
      onSuccess();
    } catch {
      toast.error("Quick log failed. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="cursor-pointer select-none flex items-center justify-between group"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Quick Log
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
      </SidebarGroupLabel>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarGroupContent className="space-y-3 pb-2">
              {/* Pain Level */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pain Level</span>
                  <span className="text-xs font-semibold tabular-nums w-4 text-right">
                    {pain[0]}
                  </span>
                </div>
                <Slider
                  value={pain}
                  onValueChange={setPain}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3"
                />
              </div>

              {/* Stress Level */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stress Level</span>
                  <span className="text-xs font-semibold tabular-nums w-4 text-right">
                    {stress[0]}
                  </span>
                </div>
                <Slider
                  value={stress}
                  onValueChange={setStress}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3"
                />
              </div>

              {/* Stool Frequency */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stool Freq.</span>
                  <span className="text-xs font-semibold tabular-nums w-4 text-right">
                    {stoolFreq[0]}
                  </span>
                </div>
                <Slider
                  value={stoolFreq}
                  onValueChange={setStoolFreq}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-3"
                />
              </div>

              {/* Log Button */}
              <Button
                onClick={handleLog}
                disabled={isLogging}
                size="sm"
                className="w-full h-7 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-md"
              >
                {isLogging ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Log
              </Button>
            </SidebarGroupContent>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarGroup>
  );
}