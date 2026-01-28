import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  companyName: text("company_name"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationLogs = pgTable("conversation_logs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull().unique(),
  fullTranscript: jsonb("full_transcript").$type<Array<{role: string, content: string}>>(),
  extractedData: jsonb("extracted_data"),
  preliminaryAnalysis: jsonb("preliminary_analysis"),
  status: text("status").default("in_progress"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  adminNotes: text("admin_notes"),
  adminNotesUpdatedAt: timestamp("admin_notes_updated_at"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationLogId: integer("conversation_log_id").notNull().references(() => conversationLogs.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const customersRelations = relations(customers, ({ many }) => ({
  conversationLogs: many(conversationLogs),
}));

export const conversationLogsRelations = relations(conversationLogs, ({ one, many }) => ({
  customer: one(customers, {
    fields: [conversationLogs.customerId],
    references: [customers.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversationLog: one(conversationLogs, {
    fields: [messages.conversationLogId],
    references: [conversationLogs.id],
  }),
}));

// === INSERT SCHEMAS ===
export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertConversationLogSchema = createInsertSchema(conversationLogs).omit({ 
  id: true, 
  startedAt: true,
  completedAt: true,
  status: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});

// === TYPE EXPORTS ===
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type ConversationLog = typeof conversationLogs.$inferSelect;
export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// === API CONTRACT TYPES ===
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
  conversation: Omit<ConversationLog, 'preliminaryAnalysis'>;
  messages: Message[];
  customer: Customer | null;
};
