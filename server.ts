import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to generate text with model fallback if upstream has demand spikes
async function generateWithFallback(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [prompt],
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed: ${err.message || err}. Trying fallback...`);
      // Continue to next model on 503 or 404
      continue;
    }
  }

  throw new Error('AI service temporarily busy. Please retry in a moment.');
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// AI Query Endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in your environment.',
      });
    }

    const systemPrompt = `You are the executive sales assistant embedded in a personal Client & Sales Tracker for a business selling custom websites and Google NFC Review cards/stands.
You give sharp, direct, high-value advice and summaries. You avoid boilerplate and filler.

CURRENT BUSINESS SNAPSHOT:
${JSON.stringify(context || {}, null, 2)}

User Question: ${query}

Keep your answer focused, highly actionable, and formatted cleanly with markdown bullets or numbers when appropriate.`;

    const answer = await generateWithFallback(systemPrompt);
    return res.json({ answer });
  } catch (error: any) {
    console.error('Gemini query error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate AI response',
    });
  }
});

// AI Analyze Notes & Memory Endpoint
app.post('/api/ai/analyze-notes', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
      });
    }

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

    const analysis = await generateWithFallback(prompt);
    return res.json({ analysis });
  } catch (error: any) {
    console.error('Gemini notes analysis error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze notes',
    });
  }
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
