import { z } from 'zod';
import { conversations, messages } from './schema';

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
          conversation: z.custom<typeof conversations.$inferSelect>(),
          messages: z.array(z.custom<typeof messages.$inferSelect>()),
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
