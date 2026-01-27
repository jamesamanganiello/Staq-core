import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";

// Initialize Anthropic client using Replit AI integration env vars
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy", // Replit handles the key
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are an expert sales operations consultant for STAQ. 
Your goal is to audit a B2B company's sales and marketing technology stack.
You need to find out:
1. Contact details (Name, Company, Role) if not already provided.
2. What CRM they use (Salesforce, HubSpot, etc.)
3. What Sales Engagement platform they use (Outreach, Salesloft, Apollo, etc.)
4. What Conversation Intelligence tool they use (Gong, Chorus, etc.)
5. What Data provider they use (ZoomInfo, Apollo, Lusha, etc.)

Ask ONE question at a time. Keep it conversational and professional. 
Do not ask for all information at once.
When you have identified all the tools or if the user doesn't have one, move to the next.

When the conversation is complete (you have all info or user explicitly ends it), 
you MUST output a JSON summary in the LAST message. 
Mark the conversation as complete by adding "ANALYSIS_COMPLETE" at the very end.

The JSON summary format inside the final message:
\`\`\`json
{
  "contact": { "name": "...", "company": "...", "role": "..." },
  "stack": {
    "crm": "...",
    "sales_engagement": "...",
    "conversation_intel": "...",
    "data_provider": "..."
  },
  "analysis": "Brief 2-3 sentence analysis of their stack maturity."
}
\`\`\`
`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Start a new conversation
  app.post(api.chat.start.path, async (req, res) => {
    try {
      const { customerInfo } = api.chat.start.input.parse(req.body);
      const sessionId = randomUUID();

      // Create conversation record
      const conversation = await storage.createConversation({
        sessionId,
        customerInfo: customerInfo || {},
        transcript: [],
      });

      // Initial greeting from Claude
      // We can either hardcode the first message to save latency/tokens 
      // or ask Claude to start. Let's ask Claude to start contextually.
      
      const initialUserContext = customerInfo 
        ? `Hi, I am ${customerInfo.name} from ${customerInfo.company}.` 
        : "Hi, I'm interested in a stack audit.";

      // Record implicit user start message (optional, but good for context)
      // For now, let's just send a system prompt + context to get the first question
      
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: "Please start the audit interview. " + initialUserContext }
        ],
      });

      const firstQuestion = response.content[0].type === 'text' ? response.content[0].text : "Hello! Let's start the audit.";

      // Store the Assistant's first message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: firstQuestion
      });

      res.status(201).json({
        sessionId,
        conversationId: conversation.id,
        message: firstQuestion,
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  // Handle user message
  app.post(api.chat.message.path, async (req, res) => {
    try {
      const { message } = api.chat.message.input.parse(req.body);
      const { sessionId } = req.params;

      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Store User Message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message
      });

      // Get history
      const history = await storage.getMessages(conversation.id);
      
      // Format for Anthropic
      const messages = history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      // Call Claude
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages,
      });

      const assistantText = response.content[0].type === 'text' ? response.content[0].text : "";

      // Check for completion
      let isComplete = false;
      let summary = null;
      let finalMessage = assistantText;

      if (assistantText.includes("ANALYSIS_COMPLETE")) {
        isComplete = true;
        // Extract JSON
        const jsonMatch = assistantText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            summary = JSON.parse(jsonMatch[1]);
            // Remove the JSON and marker from the displayed message
            finalMessage = assistantText.replace(/```json\n[\s\S]*?\n```/, "").replace("ANALYSIS_COMPLETE", "").trim();
          } catch (e) {
            console.error("Failed to parse summary JSON", e);
          }
        }
        
        // Update conversation status
        await storage.updateConversation(conversation.id, {
          isComplete: true,
          summary: summary || undefined
        });
      }

      // Store Assistant Message (the full text including JSON for record, or cleaned? Let's store full for audit, display cleaned)
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: assistantText 
      });

      res.json({
        message: finalMessage,
        isComplete,
        summary
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get history
  app.get(api.chat.history.path, async (req, res) => {
    const { sessionId } = req.params;
    const conversation = await storage.getConversationBySessionId(sessionId);
    if (!conversation) {
      return res.status(404).json({ message: "Session not found" });
    }
    const messages = await storage.getMessages(conversation.id);
    res.json({ conversation, messages });
  });

  return httpServer;
}
