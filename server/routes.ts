import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// System prompt version tracking
const PROMPT_VERSION = "2.0.0";
const PROMPT_UPDATED = "2026-01-28";

const SYSTEM_PROMPT = `You are Staq, an AI assistant conducting an intake conversation for a GTM tech stack health check. Your goal is to gather the information needed to prepare for a screen share audit while making the conversation feel natural and expert-level.

## Your Personality
- Warm but professional
- Knowledgeable about sales and marketing technology
- Curious about their specific situation
- Non-judgmental about current state

## Conversation Structure
Cover these areas in a natural flow, adapting based on their answers:

1. COMPANY CONTEXT
- Company name, industry, size
- Sales team structure
- Who they sell to

2. CRM FOUNDATION
- Which CRM (Salesforce or HubSpot)
- How long they've used it
- General satisfaction

3. TOOL INVENTORY
- Conversation intelligence (Gong, Chorus, etc.)
- Sales engagement (Outreach, SalesLoft, etc.)
- Data/enrichment (ZoomInfo, Apollo, etc.)
- For each: rough seat count and cost if known

4. INTEGRATION STATUS
- Which tools connect to CRM
- Data sync quality
- Any known issues

5. PAIN POINTS
- Biggest frustration with current stack
- What they hope this audit solves
- Any specific tools they're concerned about

6. ATTRIBUTION
- Can they prove tool ROI today?
- How do they answer "is X worth it?"

7. LOGISTICS
- Availability for 45-min screen share
- Anyone else who should join
- Tools to prioritize

## Rules
1. Ask ONE question at a time
2. Acknowledge their answer before moving to next topic
3. Skip sections that don't apply (e.g., don't ask about Salesforce if they use HubSpot)
4. If they seem uncertain, note it rather than pressing—we'll investigate on screen share
5. Keep total conversation under 25 exchanges
6. When you have enough info, generate a completion summary

## Completion Summary Format
When complete, output a JSON block wrapped in \`\`\`json tags with:

\`\`\`json
{
  "company_context": {
    "name": "...",
    "industry": "...",
    "size": "...",
    "sales_team_structure": "...",
    "target_customer": "..."
  },
  "crm": {
    "platform": "...",
    "years_used": "...",
    "satisfaction": "..."
  },
  "tools": [
    {
      "category": "conversation_intelligence|sales_engagement|data_enrichment|other",
      "name": "...",
      "seats": "...",
      "monthly_cost": "..."
    }
  ],
  "integrations": {
    "crm_connected_tools": [...],
    "sync_quality": "...",
    "known_issues": [...]
  },
  "pain_points": [...],
  "attribution_readiness": {
    "can_prove_roi": true|false,
    "current_method": "..."
  },
  "logistics": {
    "availability": "...",
    "additional_attendees": [...],
    "priority_tools": [...]
  },
  "preliminary_analysis": {
    "estimated_health_score": 0-100,
    "red_flags": [...],
    "screen_share_focus_areas": [...],
    "information_gaps": [...]
  }
}
\`\`\`

After outputting the JSON, add "INTAKE_COMPLETE" on a new line to signal you're done.

IMPORTANT: The preliminary_analysis is for internal admin use only—the customer will NOT see it. Keep your closing message warm and focused on next steps (scheduling the call).

Begin by introducing yourself and asking about their company.`;

const FIRST_MESSAGE = "Hi! I'm Staq, and I'll be helping prepare for your GTM tech stack audit. This conversation takes about 5-10 minutes and helps us make the most of our screen share together. Let's start with the basics—what company are you with, and what does your team sell?";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Log prompt version on startup
  console.log(`[staq] System prompt version: ${PROMPT_VERSION} (updated: ${PROMPT_UPDATED})`);
  
  // Start a new conversation
  app.post(api.chat.start.path, async (req, res) => {
    try {
      const sessionId = randomUUID();

      const conversationLog = await storage.createConversationLog({
        sessionId,
        fullTranscript: [],
      });

      // Store the first assistant message
      await storage.createMessage({
        conversationLogId: conversationLog.id,
        role: "assistant",
        content: FIRST_MESSAGE
      });

      res.status(201).json({
        sessionId,
        conversationId: conversationLog.id,
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
      const sessionId = req.params.sessionId as string;

      const conversationLog = await storage.getConversationLogBySessionId(sessionId);
      if (!conversationLog) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Store user message
      await storage.createMessage({
        conversationLogId: conversationLog.id,
        role: "user",
        content: message
      });

      // Get full conversation history
      const history = await storage.getMessages(conversationLog.id);
      
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
      let preliminaryAnalysis = null;
      let displayMessage = assistantText;

      if (assistantText.includes("INTAKE_COMPLETE")) {
        isComplete = true;
        
        // Extract JSON from the response
        const jsonMatch = assistantText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            const fullData = JSON.parse(jsonMatch[1]);
            
            // Separate preliminary_analysis (admin-only) from customer data
            preliminaryAnalysis = fullData.preliminary_analysis || null;
            delete fullData.preliminary_analysis;
            extractedData = fullData;
            
            // Clean up message for display (remove JSON and marker)
            displayMessage = assistantText
              .replace(/```json\n[\s\S]*?\n```/, "")
              .replace("INTAKE_COMPLETE", "")
              .trim();
            
            // Create or update customer record (using new JSON structure)
            const customer = await storage.createCustomer({
              contactName: extractedData?.company_context?.name || extractedData?.contact?.name,
              contactEmail: extractedData?.logistics?.contact_email || extractedData?.contact?.email,
              companyName: extractedData?.company_context?.name || extractedData?.company?.name,
            });
            
            // Update conversation log with customer link and completion data
            await storage.updateConversationLog(conversationLog.id, {
              customerId: customer.id,
              status: "completed",
              completedAt: new Date(),
              extractedData: extractedData,
              preliminaryAnalysis: preliminaryAnalysis,
            });
          } catch (e) {
            console.error("Failed to parse extracted data JSON", e);
          }
        }
      }

      // Store assistant message (full text for record)
      await storage.createMessage({
        conversationLogId: conversationLog.id,
        role: "assistant",
        content: assistantText
      });

      // Update full transcript
      const updatedHistory = await storage.getMessages(conversationLog.id);
      await storage.updateConversationLog(conversationLog.id, {
        fullTranscript: updatedHistory.map(m => ({ role: m.role, content: m.content }))
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
    const sessionId = req.params.sessionId as string;
    const result = await storage.getConversationLogWithCustomer(sessionId);
    if (!result) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    const messages = await storage.getMessages(result.log.id);
    
    // Filter out admin-only data (preliminaryAnalysis) before sending to client
    const { preliminaryAnalysis, ...safeConversation } = result.log;
    
    res.json({ conversation: safeConversation, messages, customer: result.customer });
  });

  return httpServer;
}
