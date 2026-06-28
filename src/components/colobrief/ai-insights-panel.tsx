"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { SymptomLog } from "@/types/symptom";
import { getAuthHeaders } from "@/stores/auth-store";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIInsightsPanelProps {
  symptoms: SymptomLog[];
}

const QUICK_QUESTIONS = [
  "What's my worst trigger?",
  "Am I improving?",
  "When should I see a doctor?",
  "Explain my trends",
];

function parseMarkdown(text: string) {
  // Split by newlines first
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // List items starting with -
    if (line.match(/^[\s]*[-*]\s/)) {
      const content = line.replace(/^[\s]*[-*]\s/, "");
      elements.push(
        <li
          key={i}
          className="ml-4 list-disc"
          dangerouslySetInnerHTML={{ __html: parseInline(content) }}
        />
      );
    } else {
      // Paragraph with inline parsing
      elements.push(
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
          {i < lines.length - 1 && <br />}
        </span>
      );
    }
  });

  return elements;
}

function parseInline(text: string): string {
  // Bold: **text** → <strong>text</strong>
  let result = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text* → <em>text</em>
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  return result;
}

function TypingIndicator() {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
          <Bot className="h-4 w-4 text-teal-600" />
        </div>
        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
          <div className="flex gap-1">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        AI may take longer due to rate limits — please wait patiently.
      </p>
    </div>
  );
}

export default function AIInsightsPanel({ symptoms }: AIInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      try {
        // Keep only last 10 messages for token limits
        const recentMessages = updatedMessages.slice(-10);
        const symptomData = JSON.stringify(symptoms, null, 2);

        const res = await fetch("/api/symptoms/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            messages: recentMessages,
            symptomData,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
        }

        const data = await res.json();
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: data.message || "I couldn't generate a response. Please try again.",
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Chat error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to get AI response."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, symptoms]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleQuickQuestion = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl"
            style={{ width: 400, maxHeight: 500 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-teal-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  AI Symptom Insights
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick question chips */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 border-b px-4 py-3">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-950"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bot className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about your
                    <br />
                    UC symptom data
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {msg.role === "assistant" ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
                        <Bot className="h-4 w-4 text-teal-600" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-sm bg-teal-600 text-white"
                          : "rounded-bl-sm bg-muted text-foreground"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? parseMarkdown(msg.content)
                        : msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && <TypingIndicator />}
              </div>
            </div>

            {/* Input area */}
            <div className="border-t px-3 py-2">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your symptoms..."
                  disabled={isLoading}
                  className="h-9 flex-1 border-none bg-muted text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 shrink-0 bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl"
      >
        <Sparkles className="h-4 w-4" />
        <span>Ask AI</span>
      </motion.button>
    </div>
  );
}