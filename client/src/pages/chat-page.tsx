import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useChatHistory, useSendMessage } from "@/hooks/use-chat";
import { ChatMessage } from "@/components/chat-message";
import { TypingIndicator } from "@/components/typing-indicator";
import { CompletionScreen } from "@/components/completion-screen";
import { Send, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:sessionId");
  const [, setLocation] = useLocation();
  const sessionId = params?.sessionId || "";

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading, error } = useChatHistory(sessionId);
  const sendMessageMutation = useSendMessage(sessionId);

  useEffect(() => {
    if (error) {
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
    setInputValue("");

    try {
      await sendMessageMutation.mutateAsync({ message });
    } catch (err) {
      setInputValue(message);
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit? Your progress will be saved.")) {
      setLocation("/");
    }
  };

  const isCompleted = historyData?.conversation.status === "completed";
  const extractedData = historyData?.conversation.extractedData as any;
  const messages = historyData?.messages || [];

  // Calculate progress (rough estimate based on message count)
  const totalSteps = 6;
  const currentStep = Math.min(Math.ceil(messages.length / 4), totalSteps);
  const progressPercent = isCompleted ? 100 : (currentStep / totalSteps) * 100;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-soft-cyan">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-midnight flex items-center justify-center">
            <img src="/images/staq-logo.png" alt="Staq" className="w-6 h-6 brightness-0 invert" />
          </div>
          <p className="text-gray-500 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-soft-cyan overflow-hidden">
      {/* Header Bar - Midnight Background */}
      <header className="flex-none bg-midnight z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/images/staq-logo.png" alt="Staq" className="w-8 h-8 brightness-0 invert" />
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-tight">Staq</h1>
              <p className="text-xs text-gray-400">GTM Stack Audit</p>
            </div>
          </div>
          
          <button
            onClick={handleExit}
            className="p-2 text-gray-400 hover:text-white transition-brand rounded-lg hover:bg-white/10"
            data-testid="button-exit-chat"
            aria-label="Exit chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        {!isCompleted && (
          <div className="px-4 md:px-6 pb-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Step {currentStep} of {totalSteps}</span>
                <span className="text-xs text-gray-400">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full progress-gradient rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-[700px] mx-auto min-h-full flex flex-col justify-end">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-400 pb-20">
              <p>Starting conversation...</p>
            </div>
          )}

          <div className="space-y-4 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  role={msg.role as "user" | "assistant"} 
                  content={msg.content} 
                />
              ))}
            </AnimatePresence>
            
            {sendMessageMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <TypingIndicator />
              </motion.div>
            )}

            {isCompleted && extractedData && (
              <CompletionScreen data={extractedData} />
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* Input Area */}
      {!isCompleted && (
        <footer className="flex-none bg-white border-t border-gray-200 p-4 md:p-6">
          <div className="max-w-[700px] mx-auto">
            <form 
              onSubmit={handleSend}
              className="relative flex items-center gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer..."
                disabled={sendMessageMutation.isPending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#00B4C4] focus:ring-2 focus:ring-[#00B4C4]/20 transition-brand placeholder:text-gray-400"
                data-testid="input-chat-message"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                className="p-3 bg-[#00B4C4] text-white rounded-lg hover:bg-[#0099A8] disabled:opacity-50 disabled:cursor-not-allowed transition-brand shadow-cyan hover:shadow-cyan-lg"
                data-testid="button-send-message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}
