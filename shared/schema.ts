import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(), // UUID for frontend reference
  customerInfo: jsonb("customer_info"), // { name, email, company, website }
  summary: jsonb("summary"), // The final analysis from Claude
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertConversationSchema = createInsertSchema(conversations).omit({ 
  id: true, 
  createdAt: true,
  summary: true,
  isComplete: true 
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Request/Response types
export type StartChatRequest = {
  customerInfo?: {
    name?: string;
    email?: string;
    company?: string;
  };
};

export type StartChatResponse = {
  sessionId: string;
  conversationId: number;
  message: string; // Initial greeting/question
};

export type ChatMessageRequest = {
  message: string;
};

export type ChatMessageResponse = {
  message: string;
  isComplete: boolean;
  summary?: any; // Present if isComplete is true
};

export type ConversationHistoryResponse = {
  conversation: Conversation;
  messages: Message[];
};
