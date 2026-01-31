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
const PROMPT_VERSION = "2.2.0";
const PROMPT_UPDATED = "2026-01-31";

const SYSTEM_PROMPT = `You are Staq, an AI assistant conducting an intake conversation for a GTM tech stack health check. Your goal is to gather the information needed to prepare for a screen share audit while making the conversation feel natural and expert-level.

## Your Personality
- Warm but professional
- Knowledgeable about sales and marketing technology
- Curious about their specific situation
- Non-judgmental about current state

## Conversation Flow
Follow this EXACT sequence:

### PHASE 1: Contact Info (Quick)
1. Name (already asked in first message)
2. Email
3. Role/title

### PHASE 2: Company Context (Smart)
4. Company URL
5. When they provide URL, extract and present:
   - Company name
   - What they sell (product/service)
   - Target customer (SMB, mid-market, enterprise, or specific industry)
   - Industry vertical (SaaS, FinTech, HR Tech, etc.)
   
   Example: "Got it—looks like Bennie is a B2B HR Tech company providing employee benefits solutions. Seems like you sell to SMBs and mid-market companies looking to simplify benefits administration. Does that sound right?"
   
   IMPORTANT: If you cannot confidently determine the target customer or industry vertical from the URL, don't guess—ask as a follow-up question instead.

### PHASE 3: Sales Team
6. Sales team size
7. Team structure (if size > 2)

### PHASE 4: CRM Foundation
8. Which CRM (Salesforce or HubSpot)
9. How long they've used it
10. Satisfaction on 1-5 scale

### PHASE 5: Tool Inventory
For each category, ask what they use, then satisfaction:
11. Conversation intelligence (Gong, Chorus, etc.)
12. Sales engagement (Outreach, SalesLoft, etc.)
13. Data/enrichment - Ask: "What about data and enrichment tools? Are you using ZoomInfo, Apollo, Clay, Seamless AI, or anything like that for contact data and company intel?"
14. Other tools - Ask: "Thanks! A few more quick ones—are you using any of these?
    - Scheduling tools like Calendly or Chili Piper
    - A dialer like Aircall, Orum, or Nooks
    - CPQ or proposal software like PandaDoc or DealHub
    Just want to capture anything else that touches your sales workflow."
- For each tool: rough seat count and cost if known

## Satisfaction Scale (Use for ALL tools)
When asking about satisfaction with any tool, use this exact format:
"On a scale of 1-5, how satisfied is your team with [Tool]? (1 = actively painful, 5 = love it)"

Example: "Solid foundation there. On a scale of 1-5, how satisfied is your team with Salesforce? (1 = actively painful, 5 = love it)"

If they give a 1-2, probe briefly: "Got it—what's the biggest frustration?" then move on.
This applies to: CRM, Gong/Chorus, Outreach/SalesLoft, Sales Navigator, ZoomInfo/Apollo/Clay/Seamless AI, and any other tools they mention.

### PHASE 6: Integration & Pain Points
15. Which tools connect to CRM
16. Data sync quality / known issues
17. Biggest frustration with current stack
18. What they hope this audit solves

### PHASE 7: Attribution
19. Can they prove tool ROI today?
20. How do they answer "is X worth it?"

### PHASE 8: Logistics
21. Availability for 45-min screen share
22. Anyone else who should join
23. Tools to prioritize

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
  "contact": {
    "name": "...",
    "email": "...",
    "role": "..."
  },
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

const FIRST_MESSAGE = "Hey! I'm Staq, and I'll be helping prepare for your GTM tech stack audit. This takes about 5-10 minutes. Let's start—what's your name?";

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

      // Check for completion - detect JSON block in response
      let isComplete = false;
      let extractedData = null;
      let preliminaryAnalysis = null;
      let displayMessage = assistantText;

      // Extract JSON from the response (completion indicator)
      const jsonMatch = assistantText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        isComplete = true;
        
        try {
          const fullData = JSON.parse(jsonMatch[1]);
          
          // Separate preliminary_analysis (admin-only) from customer data
          preliminaryAnalysis = fullData.preliminary_analysis || null;
          delete fullData.preliminary_analysis;
          extractedData = fullData;
          
          // Clean up message for display - remove JSON block completely
          // Keep only the closing statement before the JSON
          displayMessage = assistantText
            .replace(/```json\n[\s\S]*?\n```/g, "")
            .replace("INTAKE_COMPLETE", "")
            .trim();
          
          // If nothing left after removing JSON, provide a default closing
          if (!displayMessage) {
            displayMessage = "Perfect! That gives me everything I need to prep for our call.";
          }
          
          // Create or update customer record (using new JSON structure)
          const customer = await storage.createCustomer({
            contactName: extractedData?.contact?.name,
            contactEmail: extractedData?.contact?.email,
            companyName: extractedData?.company_context?.name,
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
    
    const rawMessages = await storage.getMessages(result.log.id);
    
    // Filter out JSON blocks from assistant messages for display
    const messages = rawMessages.map(msg => {
      if (msg.role === "assistant" && msg.content.includes("```json")) {
        let cleanContent = msg.content
          .replace(/```json\n[\s\S]*?\n```/g, "")
          .replace("INTAKE_COMPLETE", "")
          .trim();
        
        // If nothing left, provide default closing
        if (!cleanContent) {
          cleanContent = "Perfect! That gives me everything I need to prep for our call.";
        }
        
        return { ...msg, content: cleanContent };
      }
      return msg;
    });
    
    // Filter out admin-only data (preliminaryAnalysis) before sending to client
    const { preliminaryAnalysis, ...safeConversation } = result.log;
    
    res.json({ conversation: safeConversation, messages, customer: result.customer });
  });

  // ============= ADMIN ROUTES =============
  
  // Admin login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }
    
    if (password === adminPassword) {
      // Set session cookie
      res.cookie("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      return res.json({ success: true });
    }
    
    return res.status(401).json({ message: "Invalid password" });
  });
  
  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_session");
    res.json({ success: true });
  });
  
  // Admin auth check middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    const adminCookie = req.cookies?.admin_session;
    if (adminCookie === "authenticated") {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  
  // Get all sessions (admin)
  app.get("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const results = await storage.getAllConversationsWithCustomers();
      
      const sessions = results.map(({ log, customer }) => ({
        id: log.id,
        sessionId: log.sessionId,
        companyName: customer?.companyName || (log.extractedData as any)?.company_context?.name || "Unknown",
        contactName: customer?.contactName || (log.extractedData as any)?.contact?.name || "Unknown",
        status: log.status,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        crmType: (log.extractedData as any)?.crm?.name || null,
      }));
      
      res.json({ sessions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Get single session details (admin)
  app.get("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getConversationWithCustomerById(id);
      
      if (!result) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      const messages = await storage.getMessages(result.log.id);
      
      res.json({
        log: result.log,
        customer: result.customer,
        messages,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  
  // Update admin notes
  app.patch("/api/admin/sessions/:id/notes", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      
      const updated = await storage.updateConversationLog(id, {
        adminNotes: notes,
        adminNotesUpdatedAt: new Date(),
      });
      
      res.json({ success: true, adminNotesUpdatedAt: updated.adminNotesUpdatedAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  return httpServer;
}
