import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  const cleanContent = content.replace("ANALYSIS_COMPLETE", "").trim();

  if (!cleanContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Staq Icon for assistant messages */}
        {!isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-midnight flex items-center justify-center shadow-sm mr-3 mt-1">
            <img src="/images/staq-logo.png" alt="Staq" className="w-4 h-4 brightness-0 invert" />
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "p-4 text-sm md:text-base leading-relaxed break-words",
            isUser
              ? "message-user rounded-lg rounded-br-sm"
              : "message-staq shadow-sm rounded-lg rounded-bl-sm"
          )}
          data-testid={isUser ? "message-user" : "message-assistant"}
        >
          {isUser ? (
            <p>{cleanContent}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:text-midnight prose-strong:text-midnight">
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
