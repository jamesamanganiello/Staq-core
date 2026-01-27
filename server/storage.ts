import { db } from "./db";
import { 
  conversations, messages, 
  type Conversation, type Message,
  type InsertConversation, type InsertMessage 
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Conversation methods
  createConversation(data: InsertConversation): Promise<Conversation>;
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation>;
  
  // Message methods
  createMessage(data: InsertMessage): Promise<Message>;
  getMessages(conversationId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select()
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId));
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db.update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();
