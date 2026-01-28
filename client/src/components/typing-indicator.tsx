import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      {/* Staq Icon */}
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-midnight flex items-center justify-center shadow-sm">
        <img src="/images/staq-logo.png" alt="Staq" className="w-4 h-4 brightness-0 invert" />
      </div>
      
      {/* Typing dots */}
      <div className="flex items-center space-x-1.5 p-4 bg-white rounded-lg rounded-bl-sm shadow-sm">
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
        <motion.div className="w-2 h-2 rounded-full typing-dot" />
      </div>
    </div>
  );
}
