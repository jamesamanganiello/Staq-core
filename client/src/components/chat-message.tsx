import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  // Clean content: remove system markers like ANALYSIS_COMPLETE if they leak through
  const cleanContent = content.replace("ANALYSIS_COMPLETE", "").trim();

  // If content is empty after cleaning (e.g. only system markers were present), don't render empty bubble
  if (!cleanContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm mt-1",
          isUser 
            ? "ml-3 bg-primary text-primary-foreground" 
            : "mr-3 bg-white text-primary border border-primary/20"
        )}>
          {isUser ? <User size={14} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "p-4 shadow-sm text-sm md:text-base leading-relaxed break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
              : "bg-white border border-border/50 text-foreground rounded-2xl rounded-tl-none"
          )}
        >
          {isUser ? (
            <p>{cleanContent}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-lg">
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
