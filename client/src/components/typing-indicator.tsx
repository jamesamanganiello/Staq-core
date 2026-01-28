import { motion } from "framer-motion";
import { StaqIcon } from "@/components/staq-logo";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      {/* Staq Icon */}
      <StaqIcon size={20} variant="color" />
      
      {/* Typing dots */}
      <div className="flex items-center space-x-1.5 p-4 bg-white rounded-lg rounded-bl-sm shadow-sm">
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
      </div>
    </div>
  );
}
