"use client";

import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  ClipboardList,
  Heart,
  DatabaseZap,
  Loader2,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { SymptomLog } from "@/types/symptom";

import OverviewTab from "@/components/colobrief/overview-tab";
import LogSymptomsTab from "@/components/colobrief/log-symptoms-tab";
import MyRecordsTab from "@/components/colobrief/my-records-tab";
import DoctorHandoutTab from "@/components/colobrief/doctor-handout-tab";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, shortcut: "O" },
  { key: "log", label: "Log Symptoms", icon: PlusCircle, shortcut: "L" },
  { key: "records", label: "My Records", icon: FileText, shortcut: "R" },
  { key: "handout", label: "Doctor Handout", icon: ClipboardList, shortcut: "H" },
] as const;

type TabKey = (typeof NAV_ITEMS)[number]["key"];

const TAB_TITLES: Record<TabKey, string> = {
  overview: "Overview",
  log: "Log Symptoms",
  records: "My Records",
  handout: "Doctor Handout",
};

function AppContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { theme, setTheme } = useTheme();

  const { data: symptoms = [], isLoading, isError, error } = useQuery<SymptomLog[]>({
    queryKey: ["symptoms"],
    queryFn: () => fetch("/api/symptoms").then((r) => r.json()),
  });

  const demoMutation = useMutation({
    mutationFn: () => fetch("/api/symptoms/demo", { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      toast.success("Demo data loaded! 🎉 Explore the dashboard with sample UC symptom data.");
    },
    onError: () => {
      toast.error("Failed to load demo data.");
    },
  });

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "o":
            e.preventDefault();
            setActiveTab("overview");
            break;
          case "l":
            e.preventDefault();
            setActiveTab("log");
            break;
          case "r":
            e.preventDefault();
            setActiveTab("records");
            break;
          case "h":
            e.preventDefault();
            setActiveTab("handout");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm">
                  <Heart className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ColoBrief AI</span>
                  <span className="truncate text-xs text-muted-foreground">Empathetic UC Tracking</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={activeTab === item.key}
                      onClick={() => handleTabChange(item.key)}
                      tooltip={`${item.label} (Ctrl+${item.shortcut})`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => demoMutation.mutate()}
                    disabled={demoMutation.isPending}
                    tooltip="Load Demo Data"
                    className="text-muted-foreground hover:text-foreground border-l-2 border-l-teal-500 bg-teal-500/5 hover:bg-teal-500/10 rounded-r-md"
                  >
                    {demoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DatabaseZap className="h-4 w-4" />
                    )}
                    <span>Load Demo Data</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-medium">DP</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Demo Patient</span>
              <span className="truncate text-xs text-muted-foreground">demo@colobrief.ai</span>
            </div>
          </div>
          <span className="truncate text-xs text-muted-foreground">v1.2.0</span>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="min-h-screen flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 print:hidden">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">{TAB_TITLES[activeTab]}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </header>
          <div className="h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          {/* Error Banner */}
          {isError && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load symptom data. Please try refreshing the page.
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6">
            <ScrollArea className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {activeTab === "overview" && (
                    <OverviewTab symptoms={symptoms} isLoading={isLoading} />
                  )}
                  {activeTab === "log" && (
                    <LogSymptomsTab
                      onSaved={() => queryClient.invalidateQueries({ queryKey: ["symptoms"] })}
                    />
                  )}
                  {activeTab === "records" && (
                    <MyRecordsTab
                      symptoms={symptoms}
                      isLoading={isLoading}
                      onDeleted={() =>
                        queryClient.invalidateQueries({ queryKey: ["symptoms"] })
                      }
                      onGoToLog={() => setActiveTab("log")}
                    />
                  )}
                  {activeTab === "handout" && (
                    <DoctorHandoutTab symptoms={symptoms} isLoading={isLoading} />
                  )}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </main>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-auto border-t px-6 py-3 print:hidden bg-muted/30"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>ColoBrief AI — Bridging daily flares and clinical consultations</span>
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span><kbd className="bg-background border border-border rounded-md shadow-sm text-[10px] font-mono px-1.5 py-0.5">⌘O</kbd> Overview</span>
                <span><kbd className="bg-background border border-border rounded-md shadow-sm text-[10px] font-mono px-1.5 py-0.5">⌘L</kbd> Log</span>
                <span><kbd className="bg-background border border-border rounded-md shadow-sm text-[10px] font-mono px-1.5 py-0.5">⌘R</kbd> Records</span>
                <span><kbd className="bg-background border border-border rounded-md shadow-sm text-[10px] font-mono px-1.5 py-0.5">⌘H</kbd> Handout</span>
              </div>
            </div>
          </motion.footer>

          {/* Mobile FAB - Log Symptoms */}
          <Button
            onClick={() => setActiveTab("log")}
            size="lg"
            className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-xl shadow-teal-500/30 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 z-50 p-0"
          >
            <PlusCircle className="h-7 w-7" />
          </Button>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}