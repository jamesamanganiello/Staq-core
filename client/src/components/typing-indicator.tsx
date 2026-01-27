import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-4 bg-muted/50 rounded-2xl rounded-tl-none w-fit">
      <motion.div
        className="w-2 h-2 bg-primary/40 rounded-full typing-dot"
      />
      <motion.div
        className="w-2 h-2 bg-primary/40 rounded-full typing-dot"
      />
      <motion.div
        className="w-2 h-2 bg-primary/40 rounded-full typing-dot"
      />
    </div>
  );
}
