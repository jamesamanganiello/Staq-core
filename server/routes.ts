import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are Staq, an AI assistant conducting an intake conversation for a GTM tech stack health check. Your goal is to gather baseline context in 5-10 minutes—enough to prepare for a productive screen share call, not to do the full audit here.

## Your Personality
- Warm and professional
- Efficient—you respect their time
- Knowledgeable about sales technology
- Curious but not interrogating

## Conversation Rules
1. Ask ONE question at a time
2. Use multiple choice options when provided—it's faster
3. Acknowledge their answer briefly before moving on
4. Skip questions that don't apply based on prior answers
5. Keep the whole conversation under 20 exchanges
6. When they provide a company URL, extract what you can and confirm it with them

## Question Flow
Follow this sequence, adapting based on their answers:
PHASE 1: Welcome + set expectations (1 message)
PHASE 2: Name → Email → Role (3 quick questions)
PHASE 3: Company URL → Extract & confirm → Sales team size → Team composition if applicable
PHASE 4: Inbound/outbound ratio → Deal velocity → Deal size → Buyer LinkedIn activity → Call-heavy process → Ops owner → Current mode
PHASE 5: CRM → Gong/Chorus → Outreach/SalesLoft → Sales Navigator → ZoomInfo/Apollo → Other tools
PHASE 6: Primary goal → Scheduling → Closing message

## URL Extraction
When they give a company URL, try to extract: company name, what they sell, industry, target customer, and any size signals. Present what you found and ask them to confirm or correct.

## Tool Questions
For each tool category:
- Ask if they use it (with common options)
- Don't ask satisfaction ratings or follow-up details—save that for the screen share

## Skip Logic
- If team size is 1-2, skip team composition
- If they have no CRM, skip tool questions and note this as a major finding

## When Complete
When you have gathered enough information, output a JSON block with extracted data AND a preliminary analysis. Use this exact format:

\`\`\`json
{
  "contact": {
    "name": "...",
    "email": "...",
    "role": "..."
  },
  "company": {
    "name": "...",
    "url": "...",
    "industry": "...",
    "description": "..."
  },
  "team": {
    "size": "...",
    "composition": "..."
  },
  "sales_motion": {
    "inbound_outbound_ratio": "...",
    "deal_velocity": "...",
    "deal_size": "...",
    "buyer_linkedin_activity": "...",
    "call_heavy": "...",
    "ops_owner": "...",
    "current_mode": "..."
  },
  "tools": {
    "crm": "...",
    "conversation_intel": "...",
    "sales_engagement": "...",
    "sales_navigator": "...",
    "data_provider": "...",
    "other": []
  },
  "primary_goal": "...",
  "analysis": {
    "tool_fit_signals": ["..."],
    "potential_mismatches": ["..."],
    "flags_for_call": ["..."],
    "recommended_focus_areas": ["..."]
  }
}
\`\`\`

After outputting the JSON, add "INTAKE_COMPLETE" on a new line to signal you're done.

## Important
This is a 5-10 minute intake, not an interrogation. If they give short answers, that's fine—we'll dig deeper on the call. Keep it moving.`;

const FIRST_MESSAGE = "Hey! I'm here to learn a bit about your sales stack before we dig in together. This takes about 5 minutes. Let's start—what's your name?";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Start a new conversation
  app.post(api.chat.start.path, async (req, res) => {
    try {
      const sessionId = randomUUID();

      const conversation = await storage.createConversation({
        sessionId,
        conversationLog: [],
      });

      // Store the first assistant message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: FIRST_MESSAGE
      });

      res.status(201).json({
        sessionId,
        conversationId: conversation.id,
        message: FIRST_MESSAGE,
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

      // Store user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message
      });

      // Get full conversation history
      const history = await storage.getMessages(conversation.id);
      
      // Format for Anthropic
      const messages = history.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      // Call Claude with full history
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: messages,
      });

      const assistantText = response.content[0].type === 'text' ? response.content[0].text : "";

      // Check for completion
      let isComplete = false;
      let extractedData = null;
      let displayMessage = assistantText;

      if (assistantText.includes("INTAKE_COMPLETE")) {
        isComplete = true;
        
        // Extract JSON from the response
        const jsonMatch = assistantText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[1]);
            // Clean up message for display
            displayMessage = assistantText
              .replace(/```json\n[\s\S]*?\n```/, "")
              .replace("INTAKE_COMPLETE", "")
              .trim();
          } catch (e) {
            console.error("Failed to parse extracted data JSON", e);
          }
        }
        
        // Update conversation with completion data
        await storage.updateConversation(conversation.id, {
          status: "completed",
          completedAt: new Date(),
          extractedData: extractedData,
          name: extractedData?.contact?.name,
          email: extractedData?.contact?.email,
          companyName: extractedData?.company?.name,
          companyUrl: extractedData?.company?.url,
        });
      }

      // Store assistant message (full text for record)
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: assistantText
      });

      // Update conversation log
      const updatedHistory = await storage.getMessages(conversation.id);
      await storage.updateConversation(conversation.id, {
        conversationLog: updatedHistory.map(m => ({ role: m.role, content: m.content }))
      });

      res.json({
        message: displayMessage,
        isComplete,
        extractedData
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get conversation history
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
