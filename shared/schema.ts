import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  
  // Customer info collected during conversation
  name: text("name"),
  email: text("email"),
  companyName: text("company_name"),
  companyUrl: text("company_url"),
  
  // Conversation data
  conversationLog: jsonb("conversation_log").$type<Array<{role: string, content: string}>>(),
  extractedData: jsonb("extracted_data"), // Claude's final JSON output
  
  // Status tracking
  status: text("status").default("in_progress"), // 'in_progress' | 'completed'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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
  startedAt: true,
  completedAt: true,
  extractedData: true,
  status: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Request/Response types
export type StartChatResponse = {
  sessionId: string;
  conversationId: number;
  message: string;
};

export type ChatMessageRequest = {
  message: string;
};

export type ChatMessageResponse = {
  message: string;
  isComplete: boolean;
  extractedData?: any;
};

export type ConversationHistoryResponse = {
  conversation: Conversation;
  messages: Message[];
};
