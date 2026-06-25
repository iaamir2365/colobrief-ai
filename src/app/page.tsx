"use client";

import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  ClipboardList,
  Heart,
  Database,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "log", label: "Log Symptoms", icon: PlusCircle },
  { key: "records", label: "My Records", icon: FileText },
  { key: "handout", label: "Doctor Handout", icon: ClipboardList },
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

  const { data: symptoms = [], isLoading } = useQuery<SymptomLog[]>({
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

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <Heart className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ColoBrief AI</span>
                  <span className="truncate text-xs text-muted-foreground">UC Symptom Tracker</span>
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
                      tooltip={item.label}
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
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {demoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
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
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <ScrollArea className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
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
          <footer className="mt-auto border-t px-6 py-4 text-center text-sm text-muted-foreground print:hidden">
            ColoBrief AI — Bridging daily flares and clinical consultations
          </footer>
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