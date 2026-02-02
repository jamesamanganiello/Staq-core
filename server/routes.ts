import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { extractWebsiteContent, formatExtractedContent } from "./url-extractor";
import { detectToolsInMessage, generateToolPromptInjection } from "./tool-intelligence";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// System prompt version tracking
const PROMPT_VERSION = "2.8.0";
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
5. When they provide a URL:

   **PRIORITY 1 - Use extracted website content if available:**
   If you see [WEBSITE CONTENT EXTRACTED], use that data to describe their company accurately.
   
   **PRIORITY 2 - Use your training knowledge for well-known companies:**
   If website fetch failed BUT you recognize the company from your training data (e.g., PitchBook, ZoomInfo, Salesforce, Gong, Outreach, Stripe, HubSpot, Snowflake, etc.), respond with what you KNOW:
   
   Example: "Got it—PitchBook, the financial data and research platform for PE, VC, and M&A. You're selling to investors, deal teams, that world. Does that sound right?"
   
   **PRIORITY 3 - Ask only for genuinely obscure companies:**
   Only say "I couldn't pull details" if BOTH conditions are true:
   - The website fetch failed AND
   - You genuinely don't recognize the company from your training data
   
   In that case: "I'm not familiar with [company]—can you give me the quick pitch? What does your company sell and who's your target customer?"
   
   **Always confirm:** End with "Does that sound right?" to let them correct you.

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
2. Skip sections that don't apply (e.g., don't ask about Salesforce if they use HubSpot)
3. If they seem uncertain, note it rather than pressing—we'll investigate on screen share
4. Keep total conversation under 30 exchanges
5. When you have enough info, generate a completion summary

## CRITICAL: Engage Before Moving On

When a user shares something meaningful (a pain point, frustration, or interesting setup), do NOT immediately jump to the next question. Instead:
1. **Acknowledge** with a pattern ("that's common with X" or "I hear that a lot")
2. **Ask ONE clarifying question** with specific options (not open-ended)
3. **Wait for their answer**, THEN move to the next topic

The intake should feel like talking to a consultant who's seen this before—not a form that just collects answers.

**WRONG approach:**
User: "My team finds Apollo confusing"
Staq: "That's valuable context—we'll explore that during the audit. How many seats?"

**RIGHT approach:**
User: "My team finds Apollo confusing"
Staq: "That's really common with Apollo—there's a lot packed in there. Is it more the sequencing and workflow side, or the prospecting and list-building that trips them up?"
[Wait for answer]
Staq: "Got it—we'll dig into that on the call. How many seats, and roughly what are you paying?"

**WRONG approach (assuming all-in-one too early):**
User: "We use Apollo" (for sales engagement)
Staq: "Smart—using Apollo as your all-in-one. Quick gut check: is your team actually using both the sequences AND the enrichment side?"

**RIGHT approach (confirm each category first):**
User: "We use Apollo" (for sales engagement)
Staq: "Got it—Apollo for sequences. On a scale of 1-5, how's that working for your team?"
[Continue with satisfaction + any pain points]
[THEN ask about data/enrichment tools separately]
Staq: "What about data and enrichment? Are you using ZoomInfo, Clay, Seamless AI—or is Apollo handling that for you too?"

**IF user confirms Apollo for data too:**
Staq: "Ah, so you're running Apollo as the full all-in-one—that's smart cost-wise. Are you actually getting value from both sides, or has one kind of fallen off?"

## PRINCIPLE: Don't Be Presumptuous

Confirm what they use for EACH category first, then recognize patterns. The "all-in-one" observation is a smart insight—but only AFTER we've confirmed both use cases.

One extra exchange on a pain point is worth more than rushing through the checklist. Pause on interesting moments. Show you understand the tool before moving to the next category.

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

      // Detect URLs in the message - look for company website URLs
      const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/gi;
      const urls = message.match(urlRegex);
      let websiteContext = "";
      
      // Get conversation history to check if we're in the company context phase
      const existingHistory = await storage.getMessages(conversationLog.id);
      const isEarlyConversation = existingHistory.length < 10;
      const lastAssistantMessage = existingHistory.filter(m => m.role === 'assistant').pop()?.content || '';
      const askedForUrl = /url|website|company|domain/i.test(lastAssistantMessage);
      
      // Only fetch URLs if we're early in conversation or explicitly asked for company URL
      if (urls && urls.length > 0 && (isEarlyConversation || askedForUrl)) {
        const url = urls[0];
        
        // Skip common non-company URLs
        const skipDomains = ['calendly.com', 'google.com', 'linkedin.com', 'twitter.com', 'facebook.com', 'youtube.com', 'zoom.us'];
        const isSkippedDomain = skipDomains.some(domain => url.toLowerCase().includes(domain));
        
        if (!isSkippedDomain) {
          console.log(`[URL Extractor] Fetching content from: ${url}`);
          
          const extracted = await extractWebsiteContent(url);
          
          if (extracted.success) {
            websiteContext = `\n\n[WEBSITE CONTENT EXTRACTED - USE THIS FOR COMPANY CONTEXT]\n${formatExtractedContent(extracted)}\n[END WEBSITE CONTENT]`;
            console.log(`[URL Extractor] Successfully extracted content from ${extracted.domain}`);
          } else {
            websiteContext = `\n\n[WEBSITE FETCH FAILED for ${extracted.domain}]\nThe website could not be fetched. However, if you recognize this company from your training data (e.g., it's a well-known B2B company), describe what you know about them and ask "Does that sound right?" Only ask for a description if you genuinely don't recognize the company.\n[END WEBSITE CONTENT]`;
            console.log(`[URL Extractor] Failed to fetch ${url}: ${extracted.error}`);
          }
        }
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

      // Detect mentioned tools across all user messages in this conversation
      const mentionedTools: string[] = [];
      for (const msg of history) {
        if (msg.role === 'user') {
          const tools = detectToolsInMessage(msg.content);
          for (const tool of tools) {
            if (!mentionedTools.includes(tool)) {
              mentionedTools.push(tool);
            }
          }
        }
      }
      
      // Generate tool-specific intelligence injection
      const toolIntelligence = generateToolPromptInjection(mentionedTools);
      if (mentionedTools.length > 0) {
        console.log(`[Tool Intelligence] Injected knowledge for: ${mentionedTools.join(', ')}`);
      }

      // Augment system prompt with website context and tool intelligence
      let augmentedPrompt = SYSTEM_PROMPT;
      if (websiteContext) {
        augmentedPrompt += websiteContext;
      }
      if (toolIntelligence) {
        augmentedPrompt += toolIntelligence;
      }

      // Call Claude with full history
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: augmentedPrompt,
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
