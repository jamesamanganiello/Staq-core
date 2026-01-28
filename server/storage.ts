import { db } from "./db";
import { 
  customers, conversationLogs, messages, 
  type Customer, type ConversationLog, type Message,
  type InsertCustomer, type InsertConversationLog, type InsertMessage 
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createCustomer(data: InsertCustomer): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer>;
  
  createConversationLog(data: InsertConversationLog): Promise<ConversationLog>;
  getConversationLogBySessionId(sessionId: string): Promise<ConversationLog | undefined>;
  getConversationLogWithCustomer(sessionId: string): Promise<{ log: ConversationLog; customer: Customer | null } | undefined>;
  updateConversationLog(id: number, updates: Partial<ConversationLog>): Promise<ConversationLog>;
  
  createMessage(data: InsertMessage): Promise<Message>;
  getMessages(conversationLogId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    const [updated] = await db.update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async createConversationLog(data: InsertConversationLog): Promise<ConversationLog> {
    const [log] = await db.insert(conversationLogs).values(data).returning();
    return log;
  }

  async getConversationLogBySessionId(sessionId: string): Promise<ConversationLog | undefined> {
    const [log] = await db.select()
      .from(conversationLogs)
      .where(eq(conversationLogs.sessionId, sessionId));
    return log;
  }

  async getConversationLogWithCustomer(sessionId: string): Promise<{ log: ConversationLog; customer: Customer | null } | undefined> {
    const [log] = await db.select()
      .from(conversationLogs)
      .where(eq(conversationLogs.sessionId, sessionId));
    
    if (!log) return undefined;
    
    let customer: Customer | null = null;
    if (log.customerId) {
      const [c] = await db.select()
        .from(customers)
        .where(eq(customers.id, log.customerId));
      customer = c || null;
    }
    
    return { log, customer };
  }

  async updateConversationLog(id: number, updates: Partial<ConversationLog>): Promise<ConversationLog> {
    const [updated] = await db.update(conversationLogs)
      .set(updates)
      .where(eq(conversationLogs.id, id))
      .returning();
    return updated;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async getMessages(conversationLogId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.conversationLogId, conversationLogId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();
