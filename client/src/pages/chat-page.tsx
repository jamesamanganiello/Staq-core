import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useChatHistory, useSendMessage } from "@/hooks/use-chat";
import { ChatMessage } from "@/components/chat-message";
import { TypingIndicator } from "@/components/typing-indicator";
import { CompletionScreen } from "@/components/completion-screen";
import { Send, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:sessionId");
  const [, setLocation] = useLocation();
  const sessionId = params?.sessionId || "";

  // State
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries & Mutations
  const { data: historyData, isLoading, error } = useChatHistory(sessionId);
  const sendMessageMutation = useSendMessage(sessionId);

  // Effects
  useEffect(() => {
    if (error) {
      // If session invalid, go back home
      setLocation("/");
    }
  }, [error, setLocation]);

  useEffect(() => {
    scrollToBottom();
  }, [historyData?.messages, sendMessageMutation.isPending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    const message = inputValue;
    setInputValue(""); // Optimistic clear

    try {
      await sendMessageMutation.mutateAsync({ message });
    } catch (err) {
      setInputValue(message); // Restore on error
    }
  };

  // Derived state
  const isCompleted = historyData?.conversation.status === "completed";
  const extractedData = historyData?.conversation.extractedData as any;
  const messages = historyData?.messages || [];

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-border shadow-sm z-10 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground leading-tight">Staq</h1>
              <p className="text-xs text-muted-foreground">AI Sales Stack Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-accent animate-pulse'}`} />
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {isCompleted ? "Ready to Schedule" : "Intake in Progress"}
            </span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end">
          {/* Welcome Message Placeholder if empty */}
          {messages.length === 0 && (
             <div className="flex-1 flex items-center justify-center text-muted-foreground/40 pb-20">
               <p>Starting conversation...</p>
             </div>
          )}

          {/* Messages List */}
          <div className="space-y-2 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  role={msg.role as "user" | "assistant"} 
                  content={msg.content} 
                />
              ))}
            </AnimatePresence>
            
            {/* Loading Indicator */}
            {sendMessageMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-6"
              >
                <TypingIndicator />
              </motion.div>
            )}

            {/* Completion Screen */}
            {isCompleted && extractedData && (
              <CompletionScreen data={extractedData} />
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* Input Area - Hidden when completed */}
      {!isCompleted && (
        <footer className="flex-none bg-white border-t border-border p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSend}
              className="relative flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-200"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer..."
                disabled={sendMessageMutation.isPending}
                className="flex-1 bg-transparent border-none px-4 py-3 text-base focus:outline-none placeholder:text-muted-foreground/60"
                data-testid="input-chat-message"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95"
                data-testid="button-send-message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Press Enter to send
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
