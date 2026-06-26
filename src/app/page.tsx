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
  CalendarDays,
  LogOut,
} from "lucide-react";
import { format, parseISO } from "date-fns";
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
import { useAuthStore, getAuthHeaders } from "@/stores/auth-store";

import OverviewTab from "@/components/colobrief/overview-tab";
import LogSymptomsTab from "@/components/colobrief/log-symptoms-tab";
import MyRecordsTab from "@/components/colobrief/my-records-tab";
import DoctorHandoutTab from "@/components/colobrief/doctor-handout-tab";
import OnboardingTour from "@/components/colobrief/onboarding-tour";
import QuickLogPanel from "@/components/colobrief/quick-log-panel";
import AuthForm from "@/components/auth-form";

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
  const { user, token, isLoading: authLoading, isInitialized, initialize, logout } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Authenticated fetch wrapper
  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  const { data: symptoms = [], isLoading, isError, error } = useQuery<SymptomLog[]>({
    queryKey: ["symptoms"],
    queryFn: () => authFetch("/api/symptoms").then((r) => {
      if (r.status === 401) {
        logout();
        throw new Error("Session expired");
      }
      return r.json();
    }),
    enabled: !!token && isInitialized,
  });

  const demoMutation = useMutation({
    mutationFn: () => authFetch("/api/symptoms/demo", { method: "POST" }).then((r) => {
      if (r.status === 401) {
        logout();
        throw new Error("Session expired");
      }
      return r.json();
    }),
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

  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Loading / auth gate
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center"
          >
            <Heart className="h-5 w-5 text-white" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login/signup form
  if (!token || !user) {
    return <AuthForm />;
  }

  // Email not verified — show verification form
  if (!user.emailVerified) {
    return <AuthForm />;
  }

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
                      className={activeTab === item.key ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"}
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
                    className="text-muted-foreground hover:text-foreground border-l-2 border-l-teal-500 bg-teal-500/5 hover:bg-teal-500/10 rounded-r-md btn-premium"
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

          <SidebarSeparator />

          <QuickLogPanel
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["symptoms"] })}
          />
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-medium">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-rose-500"
              onClick={() => {
                logout();
                queryClient.clear();
                toast.success("Logged out successfully");
              }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <span className="truncate text-xs text-muted-foreground">v1.5.0</span>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <OnboardingTour
          onLoadDemo={() => demoMutation.mutate()}
          onStartLogging={() => setActiveTab("log")}
          symptomCount={symptoms.length}
        />
        <div className="min-h-screen flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 print:hidden">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold tracking-tight">{TAB_TITLES[activeTab]}</h1>
            {symptoms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {symptoms.length} day{symptoms.length !== 1 ? "s" : ""} tracked
              </motion.div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {activeTab === "overview" && symptoms.length > 0 && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground"
                >
                  <CalendarDays className="h-3 w-3" />
                  Last: {format(parseISO(symptoms[0].date), "MMM d")}
                </motion.div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Error Banner */}
          {isError && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load symptom data. Please try refreshing the page."}
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
                      symptoms={symptoms}
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
            className="mt-auto border-t px-6 py-3 print:hidden bg-muted/30 card-glow"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                  <Heart className="h-3 w-3 text-white" fill="white" />
                </div>
                <span className="font-medium">ColoBrief AI</span>
                <span className="text-muted-foreground/50">|</span>
                <span className="text-xs">Bridging daily flares and clinical consultations</span>
              </div>
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
            className="fixed bottom-6 right-6 md:hidden h-14 w-14 rounded-full shadow-xl shadow-teal-500/30 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 z-50 p-0 glow-teal"
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