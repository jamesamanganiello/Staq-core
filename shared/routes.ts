import { z } from 'zod';
import { conversationLogs, messages, customers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Define message schema for validation
const messageSchema = z.object({
  id: z.number(),
  conversationLogId: z.number(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string().nullable(),
});

// Define conversation log schema (without preliminaryAnalysis for security)
const conversationLogSchema = z.object({
  id: z.number(),
  customerId: z.number().nullable(),
  sessionId: z.string(),
  fullTranscript: z.any().nullable(),
  extractedData: z.any().nullable(),
  status: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

// Define customer schema
const customerSchema = z.object({
  id: z.number(),
  companyName: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export const api = {
  chat: {
    start: {
      method: 'POST' as const,
      path: '/api/chat/start',
      input: z.object({}).optional(),
      responses: {
        201: z.object({
          sessionId: z.string(),
          conversationId: z.number(),
          message: z.string(),
        }),
      },
    },
    message: {
      method: 'POST' as const,
      path: '/api/chat/:sessionId/message',
      input: z.object({
        message: z.string(),
      }),
      responses: {
        200: z.object({
          message: z.string(),
          isComplete: z.boolean(),
          extractedData: z.any().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/chat/:sessionId',
      responses: {
        200: z.object({
          conversation: conversationLogSchema,
          messages: z.array(messageSchema),
          customer: customerSchema.nullable(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
