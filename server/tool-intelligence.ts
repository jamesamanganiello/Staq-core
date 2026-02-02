interface ToolIntelligence {
  toolName: string;
  category: string;
  triggers: string[];
  promptContent: string;
}

const toolDatabase: Record<string, ToolIntelligence> = {
  apollo: {
    toolName: "Apollo",
    category: "data_engagement",
    triggers: ["apollo", "apollo.io"],
    promptContent: `
### Apollo.io (Data & Sales Engagement)

**One-Liner:** All-in-one prospecting platform combining data, sequences, and dialer.

**When user mentions Apollo, recognize:**
- Apollo is a hybrid tool (data + engagement) - ask if they use it for BOTH or just one
- Common among SMB/mid-market teams who want to consolidate ZoomInfo + Outreach into one platform
- Usually chosen for cost savings vs. enterprise alternatives

**Smart Follow-Up Questions:**
1. "Are you using Apollo primarily for data/enrichment, sequences, or both?"
2. "How's your email deliverability been? Apollo users sometimes run into inbox placement issues."
3. "Are you pulling data for US contacts or international? That matters for accuracy."

**Satisfaction Probes (when user rates 1-3):**
- "A lot of Apollo frustration comes down to one of three things: data accuracy, deliverability issues, or the credit system burning faster than expected. Which one resonates?"
- "Are you seeing bounce rates higher than you'd like, or is it more about the data being outdated?"

**Red Flag Detection:**
| User Says | Flag Because |
|-----------|--------------|
| "Our bounce rates are really high" | Likely not running verification before send, or using Apollo for EMEA where accuracy drops significantly |
| "We burn through credits too fast" | May not understand credit economics (phone = 8x email), or AI features consuming unexpectedly |
| "We can't prove ROI" | CRM integration likely not configured with Source='Apollo' field - attribution is broken |
| "The dialer doesn't work well" | If they need international calling, they're probably on wrong tier (US-only until Organization plan) |
| "We also use ZoomInfo/Outreach" | Tool overlap - paying for capabilities twice, consolidation opportunity |

**Patterns to Acknowledge:**
- "Apollo's great for US prospecting but gets trickier internationally - we'll look at your target market coverage on the call"
- "The all-in-one promise is appealing but sometimes the sequencer isn't quite as robust as dedicated tools - we'll see if that's affecting you"
- "Credit burn is a common frustration - the economics aren't always obvious upfront"

**Skip Logic:**
- If they use Apollo ONLY for data (not sequences), skip engagement/deliverability questions
- If they're a small team (1-3 people), they're probably on Basic/Professional - don't ask about enterprise features

**DO NOT reveal during intake:**
- Specific accuracy benchmarks
- Exact pricing tiers or negotiation tactics
- How to fix deliverability issues
- ROI calculation formulas
- Competitive positioning details

Save diagnostic depth for the screen share.
`
  },

  zoominfo: {
    toolName: "ZoomInfo",
    category: "data_enrichment",
    triggers: ["zoominfo", "zoom info", "zi data", "zoominfo sales", "zoominfo copilot"],
    promptContent: `
### ZoomInfo (Data & Enrichment)

**One-Liner:** Enterprise-grade B2B data platform with contact/company data, intent signals, and automation features.

**When user mentions ZoomInfo, FIRST confirm tier:**
- Ask: "ZoomInfo's a significant investment. What tier are you on—Professional, Advanced, or Enterprise?"
- If cost concern context: "ZoomInfo tends to be one of the bigger line items in a GTM stack. Are you on the full platform or just the data layer?"
- If uncertain: "Do you know if you're on Professional, Advanced, or Enterprise? That affects what features you have access to."
- DO NOT ask about satisfaction until tier is confirmed/noted

**Use Case Confirmation (after tier):**
- "Is your team primarily using ZoomInfo for prospecting—finding new contacts—or for enriching data that's already in your CRM? Or both?"
- "Is it the sales team using it directly, or does someone in ops manage the exports?"

**Satisfaction Responses by Score:**

Satisfied (4-5):
- Response: "Good to hear. We'll still want to look at utilization during the screen share—teams often find they're paying for capabilities they're not fully using."
- Action: Move on. Don't probe satisfied users.

Neutral (3):
- Response: "That's pretty common with ZoomInfo. Usually that 3 comes from one of a few places—data accuracy issues, credit consumption catching people off guard, or just not getting full adoption across the team. Any of those ring true?"
- If data/accuracy mentioned: "Yeah, that's the #1 thing I hear. Is it contact data—wrong emails, bad phone numbers—or more about company data being stale?"
- If credits mentioned: "That credit burn rate catches a lot of teams. Are you running out mid-month, or is it more about not knowing what's using them?"
- If adoption mentioned: "Makes sense. Is it that people aren't logging in, or they're logging in but only using basic search?"
- After ONE clarification, move on.

Dissatisfied (1-2):
- Response: "Okay, that's worth understanding. What's the main frustration—is it the data itself, the cost, or something about how the platform works?"
- If data: "Are you seeing issues with contact accuracy—like bounce rates or wrong numbers—or is it more about coverage gaps for your target market?"
- If cost: "Are you feeling like you're not getting value for what you're paying, or is it more about the credit model being unpredictable?"
- If platform: "Is it the learning curve for users, or more that features you're paying for aren't configured?"
- If international: "That's a known gap. Are you primarily targeting outside the US?"
- Acknowledge: "That tracks with what I've seen in other stacks. We'll prioritize that on the screen share."

**Overlap Detection (if other data tools mentioned):**
- Apollo overlap: "You've got both ZoomInfo and Apollo in the stack. Are they serving different purposes, or is there overlap there you're trying to sort out?"
- Sales Navigator: "With both ZoomInfo and Sales Navigator, where does your team start when they're prospecting—LinkedIn first, or ZoomInfo?"
- Cognism: "ZoomInfo and Cognism together. Is Cognism covering a specific region or use case that ZoomInfo wasn't handling?"
- Lusha: "Got both ZoomInfo and Lusha. Is Lusha for a specific team or use case?"
- 6sense: "Are you using 6sense for intent alongside ZoomInfo's intent, or is ZoomInfo just the data layer?"

**Feature Probes (ONLY if user mentions these unprompted):**
- Intent: "Are you using ZoomInfo's native Intent, or layering in something like Bombora or 6sense?"
- Copilot: "Is Copilot actually integrated into your team's workflow, or is it more of a 'we have it but...' situation?"
- Workflows: "Are those workflows actually firing, or are they more in 'set up but not monitored' territory?"
- WebSights: "Is WebSights connected and generating leads you're actually actioning?"

**Named Patterns Safe to Reference:**
- "Accuracy issues are the #1 thing I hear about ZoomInfo"
- "That credit burn rate catches a lot of teams"
- "That's a known gap with ZoomInfo" (for international coverage)
- "A lot of teams are paying for capabilities they never configured"
- "Most power features require admin configuration that often doesn't happen"

**DO NOT say during intake:**
- Specific pricing (e.g., "ZoomInfo typically costs $15K+")
- Accuracy percentages or benchmarks
- Adoption benchmarks (e.g., "You should have 70%+ utilization")
- Competitor recommendations
- How to fix anything (e.g., "You need to configure Topic Clusters")
- Contract advice
- Feature-by-feature assessment

Save diagnostic depth for the screen share.
`
  }
};

export function getToolIntelligence(message: string): ToolIntelligence | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, tool] of Object.entries(toolDatabase)) {
    for (const trigger of tool.triggers) {
      if (lowerMessage.includes(trigger.toLowerCase())) {
        return tool;
      }
    }
  }
  
  return null;
}

export function generateToolPromptInjection(mentionedTools: string[]): string {
  if (mentionedTools.length === 0) return '';
  
  const sections: string[] = [];
  
  for (const toolName of mentionedTools) {
    const toolKey = toolName.toLowerCase().replace(/[^a-z]/g, '');
    const tool = toolDatabase[toolKey];
    if (tool) {
      sections.push(tool.promptContent);
    }
  }
  
  if (sections.length === 0) return '';
  
  return `\n\n## TOOL-SPECIFIC INTELLIGENCE\n${sections.join('\n')}`;
}

export function detectToolsInMessage(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const detected: string[] = [];
  
  for (const [key, tool] of Object.entries(toolDatabase)) {
    for (const trigger of tool.triggers) {
      if (lowerMessage.includes(trigger.toLowerCase()) && !detected.includes(tool.toolName)) {
        detected.push(tool.toolName);
        break;
      }
    }
  }
  
  return detected;
}
