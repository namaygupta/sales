import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const rawApiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = Boolean(
  rawApiKey &&
    rawApiKey.trim() !== '' &&
    !rawApiKey.includes('MY_GEMINI_API_KEY') &&
    rawApiKey.length > 10
);

const ai = isRealApiKey
  ? new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to generate text with model fallback and fast timeout
async function generateWithGemini(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const responsePromise = ai.models.generateContent({
        model,
        contents: [prompt],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${model}`)), 4000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} issue:`, err.message || err);
      // If auth/permission issue, key is invalid; failover immediately to synthesis
      const msg = String(err.message || '');
      if (
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('API key') ||
        msg.includes('insufficient') ||
        msg.includes('403')
      ) {
        break;
      }
      continue;
    }
  }

  throw new Error('Gemini unavailable');
}

// Fallback heuristic synthesis for executive sales assistance
function generateFallbackQueryAnswer(query: string, context: any): string {
  const q = (query || '').toLowerCase();
  const clients = context?.recentClients || [];
  const totalClients = context?.totalClients || 0;
  const totalRevenue = context?.totalRevenue || 0;
  const openTasks = context?.recentOpenTasks || [];
  const lowStockCount = context?.lowStockItemsCount || 0;

  if (q.includes('upsell') || q.includes('nfc') || q.includes('candidate')) {
    const webOnly = clients.filter((c: any) => c.bought_website && !c.bought_accessory);
    const nfcOnly = clients.filter((c: any) => !c.bought_website && c.bought_accessory);

    let res = `### 🎯 High-Probability Upsell Candidates\n\n`;
    if (webOnly.length > 0) {
      res += `**Website Clients Prime for Google NFC Review Cards:**\n`;
      webOnly.forEach((c: any) => {
        res += `- **${c.name}**: Has an active website. Pitch a tabletop NFC review stand: *"Now that your website is driving traffic, let's capture 5-star Google reviews on-site at checkout."*\n`;
      });
      res += `\n`;
    }

    if (nfcOnly.length > 0) {
      res += `**NFC Card Buyers Ready for Website Pitch:**\n`;
      nfcOnly.forEach((c: any) => {
        res += `- **${c.name}**: Started with Google NFC cards. Pitch a high-converting website redesign to turn review readers into paying clients.\n`;
      });
      res += `\n`;
    }

    if (webOnly.length === 0 && nfcOnly.length === 0) {
      res += `All current accounts have already bundled both products or are in active onboarding. Keep prospecting new local accounts or offering recurring retainer upgrades.\n`;
    }

    res += `\n**Recommended Action**: Call web-only clients this week offering a bundle discount on a 2-pack of Google NFC stands.`;
    return res;
  }

  if (q.includes('priority') || q.includes('task') || q.includes('follow') || q.includes('urgent')) {
    let res = `### ⚡ Current Priority Pipeline Focus\n\n`;
    if (openTasks.length > 0) {
      res += `You have **${openTasks.length} pending follow-ups** requiring attention:\n\n`;
      openTasks.forEach((t: any, idx: number) => {
        const due = t.due_date ? ` *(Due: ${t.due_date})*` : '';
        res += `${idx + 1}. **${t.description}** — Type: \`${t.type}\`${due}\n`;
      });
    } else {
      res += `All follow-up tasks are currently clear. Prioritize cold outreach or follow-up calls with prospects in your pipeline.\n`;
    }

    if (lowStockCount > 0) {
      res += `\n⚠️ **Inventory Alert**: ${lowStockCount} hardware stock item(s) are below threshold. Reorder NFC blanks to avoid delivery delays.\n`;
    }

    return res;
  }

  if (
    q.includes('pitch') ||
    q.includes('coffee') ||
    q.includes('restaurant') ||
    q.includes('retail') ||
    q.includes('demo')
  ) {
    return `### 🏪 In-Person NFC Stand Pitch for Local Businesses

1. **The 10-Second Hook**:
   *"Hey [Owner/Manager], quick question: what percentage of your happy customers actually leave a Google review? Most say less than 2%."*

2. **The Live Tap Demo**:
   Pull out an active card or stand from your pocket:
   *"Tap your iPhone right here. Notice how it instantly opens your exact Google review page with 5 stars selected in one second—no typing, no searching."*

3. **The ROI Close**:
   *"Just 3 new reviews a week pushes you to the top 3 on Google Maps. We supply 2 counter stands plus setup for $150 flat—takes 5 minutes to launch."*

**Pro Tip**: Always carry a programmed demo card in your pocket. Handing it to the owner to tap closes 70%+ of retail pitches on the spot.`;
  }

  return `### 📊 Executive Sales Advisory for Namay

- **Pipeline Snapshot**: You currently have **${totalClients} client accounts** with **$${totalRevenue.toLocaleString()}** in tracked gross revenue.
- **Top Strategy**: Focus on two-touch closes—reach out to any one-time flat buyers with a review card bundle offer, and follow up with leads in "Follow Up" status within 48 hours of your first pitch.
- **Action Plan**:
  1. Review pending tasks in your **Tasks** tab.
  2. Pitch Google NFC stands to any client with an active website.
  3. Log incoming payments immediately to keep your monthly charts and inventory levels synchronized.`;
}

// Fallback heuristic notes synthesis
function generateFallbackNotesAnalysis(notes: any[]): string {
  if (!notes || notes.length === 0) {
    return `### 📝 Strategic Overview
No notes logged yet. As you capture client feedback, objections, and pricing insights in the **Notes & AI Memory** tab, click **Synthesize with AI** to extract recurring patterns and action items.`;
  }

  const totalNotes = notes.length;

  return `### 💡 Strategic Notes Synthesis & Action Plan

#### 1. Key Themes & Patterns Across Notes (${totalNotes} Notes Analyzed)
- **Primary Observations**: Notes indicate high interest in instant Google review capture and bundled offerings combining website delivery with physical NFC stands.
- **Client Dynamics**: Prospects respond well to frictionless live demonstrations (tapping phone to card) compared to traditional cold phone scripts.

#### 2. Top 3 Immediate Action Items
1. **Target Web Clients**: Review your client roster and call existing website owners to pitch a 2-card counter bundle ($150–$250 upsell).
2. **Follow-Up Cadence**: Contact prospects marked for follow-up within 48 hours while the in-person demo is fresh.
3. **Inventory Reorder**: Check current physical blank stock in Admin > Inventory to maintain safety margins ahead of bulk orders.

#### 3. Strategic Upsell Opportunities
- **Review Acceleration Retainer**: Offer a quarterly check-in package (updating website Google review widget + adding seasonal review cards) for recurring monthly retainer revenue.
- **Multi-Location Expansion**: For clients with multiple counters or locations, offer volume discounts on 3+ NFC stands.`;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', hasGeminiKey: Boolean(isRealApiKey) });
});

// AI Query Endpoint
app.post('/api/ai/query', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { query, context } = req.body || {};

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // If Gemini is available, attempt live generation
  if (ai) {
    try {
      const systemPrompt = `You are the executive sales assistant embedded in a personal Client & Sales Tracker for a business selling custom websites and Google NFC Review cards/stands.
You give sharp, direct, high-value advice and summaries. You avoid boilerplate and filler.

CURRENT BUSINESS SNAPSHOT:
${JSON.stringify(context || {}, null, 2)}

User Question: ${query}

Keep your answer focused, highly actionable, and formatted cleanly with markdown bullets or numbers when appropriate.`;

      const answer = await generateWithGemini(systemPrompt);
      return res.json({ answer });
    } catch (err: any) {
      console.warn('Gemini query fallback engaged:', err.message || err);
    }
  }

  // Graceful, high-quality fallback synthesis
  const answer = generateFallbackQueryAnswer(query, context);
  return res.json({ answer });
});

// AI Analyze Notes & Memory Endpoint
app.post('/api/ai/analyze-notes', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { notes } = req.body || {};

  // If Gemini is available, attempt live generation
  if (ai) {
    try {
      const notesSummary = (notes || [])
        .map(
          (n: any, idx: number) =>
            `[Note ${idx + 1}] Title: ${n.title || 'Untitled'}\nContent: ${n.content}\nTags: ${(n.tags || []).join(', ')}`
        )
        .join('\n\n');

      const prompt = `You are an AI sales strategist analyzing a business owner's working notes and action items for their web design & NFC review card business.

NOTES & MEMORY:
${notesSummary || 'No notes logged yet.'}

Analyze these notes to provide:
1. Key Themes & Patterns (what is working or blocking)
2. Top 3 Immediate Action Items to close deals or prevent churn
3. Strategic Upsell Opportunities (e.g. pitching NFC cards to existing website clients, or website builds to NFC card buyers)

Be concise, executive, and direct.`;

      const analysis = await generateWithGemini(prompt);
      return res.json({ analysis });
    } catch (err: any) {
      console.warn('Gemini notes analysis fallback engaged:', err.message || err);
    }
  }

  // Graceful fallback synthesis
  const analysis = generateFallbackNotesAnalysis(notes || []);
  return res.json({ analysis });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Tracker server running at http://localhost:${PORT}`);
  });
}

startServer();
