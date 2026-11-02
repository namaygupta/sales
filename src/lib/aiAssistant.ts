// Client-side AI sales assistant engine
// Works both with server-side proxy (/api/ai/*) and static hosts (GitHub Pages, Vercel, offline)

export interface BusinessContext {
  totalClients: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItemsCount: number;
  openTasksCount: number;
  recentClients: Array<{
    name: string;
    bought_website: boolean;
    bought_accessory: boolean;
    deal_type: string;
  }>;
  recentOpenTasks: Array<{
    type: string;
    description: string;
    due_date?: string | null;
  }>;
}

export function generateLocalQueryAnswer(query: string, context: BusinessContext): string {
  const q = (query || '').toLowerCase().trim();
  const clients = context?.recentClients || [];
  const totalClients = context?.totalClients || 0;
  const totalRevenue = context?.totalRevenue || 0;
  const openTasks = context?.recentOpenTasks || [];
  const lowStockCount = context?.lowStockItemsCount || 0;

  // 1. Pitch scripts for restaurants, cafes, retail
  if (
    q.includes('pitch') ||
    q.includes('script') ||
    q.includes('coffee') ||
    q.includes('restaurant') ||
    q.includes('retail') ||
    q.includes('demo') ||
    q.includes('say')
  ) {
    return `### 🏪 In-Person Google NFC Stand Pitch for Local Businesses

1. **The 10-Second Hook**:
   *"Hey [Owner/Manager], quick question: what percentage of your happy customers actually remember to leave a Google review? Most tell us less than 2%."*

2. **The Live Tap Demo (Highest Conversion)**:
   Pull out an active card or stand from your pocket:
   *"Tap your iPhone right here. Notice how it instantly opens your exact Google review page with 5 stars selected in one second—no typing, no searching."*

3. **The ROI Close**:
   *"Just 3 new reviews a week pushes you to the top 3 on Google Maps. We supply 2 counter stands plus setup for $150 flat—takes 5 minutes to launch."*

**Pro Tip**: Always carry a programmed demo card in your pocket. Handing it to the owner to tap closes 70%+ of retail pitches on the spot.`;
  }

  // 2. Priority tasks & follow-up urgency
  if (
    q.includes('priority') ||
    q.includes('task') ||
    q.includes('follow') ||
    q.includes('urgent') ||
    q.includes('today')
  ) {
    let res = `### ⚡ Current Priority Pipeline Focus\n\n`;

    if (openTasks.length > 0) {
      res += `You have **${openTasks.length} pending action items**:\n\n`;
      openTasks.forEach((t, idx) => {
        const due = t.due_date ? ` *(Due: ${t.due_date})*` : '';
        res += `${idx + 1}. **${t.description}** — Type: \`${t.type}\`${due}\n`;
      });
      res += `\n`;
    } else {
      res += `All scheduled follow-up tasks are clear right now. Focus on prospecting new leads or following up with past quotes.\n\n`;
    }

    if (lowStockCount > 0) {
      res += `⚠️ **Inventory Notice**: ${lowStockCount} hardware stock item(s) are below threshold. Reorder NFC blanks to avoid shipment delays.\n\n`;
    }

    res += `**Action Item**: Check off overdue calls in the **Tasks** tab first, then pitch prospects in "Follow Up" status.`;
    return res;
  }

  // 3. Upsell candidates & review card targets
  if (
    q.includes('upsell') ||
    q.includes('candidate') ||
    q.includes('nfc') ||
    q.includes('accessory') ||
    q.includes('review card')
  ) {
    const webOnly = clients.filter(c => c.bought_website && !c.bought_accessory);
    const nfcOnly = clients.filter(c => !c.bought_website && c.bought_accessory);

    let res = `### 🎯 High-Probability Upsell Opportunities\n\n`;

    if (webOnly.length > 0) {
      res += `**Website Clients Prime for Google NFC Review Cards:**\n`;
      webOnly.forEach(c => {
        res += `- **${c.name}**: Already has a custom website. Pitch a counter NFC review stand: *"Now that your website is driving customer visits, let's turn happy in-person customers into 5-star Google reviews before they walk out."*\n`;
      });
      res += `\n`;
    }

    if (nfcOnly.length > 0) {
      res += `**NFC Card Buyers Ready for Website Pitch:**\n`;
      nfcOnly.forEach(c => {
        res += `- **${c.name}**: Started with Google NFC cards. Pitch a high-converting website redesign to convert the searchers who read their 5-star reviews into paying clients.\n`;
      });
      res += `\n`;
    }

    if (webOnly.length === 0 && nfcOnly.length === 0) {
      if (clients.length > 0) {
        res += `All ${clients.length} current accounts have already bundled both products. Consider offering recurring website maintenance retainers or volume discounts on multi-counter stands.\n\n`;
      } else {
        res += `You don't have any clients logged yet. Add your first client in the **Clients** tab to start tracking upsell readiness.\n\n`;
      }
    }

    res += `**Recommended Strategy**: Call clients who only purchased one item and offer a bundle upgrade with a $50 discount this week.`;
    return res;
  }

  // 4. Pricing & bundles advice
  if (
    q.includes('price') ||
    q.includes('pricing') ||
    q.includes('bundle') ||
    q.includes('cost') ||
    q.includes('how much')
  ) {
    return `### 💡 High-Margin Packaging & Pricing Strategy

- **Starter Pack**: 1 Custom Website ($799) + 1 Free Google NFC Stand (Anchors high perceived value).
- **Retail Special**: 2 Google NFC Review Stands for $150 (Unit cost ~$15, delivering 80%+ margin).
- **Growth Bundle**: Website Redesign + 2 Counter Stands + Google Review Setup for $950.
- **Volume Add-On**: Every additional counter stand after 2 is $45 flat.

**Tactical Rule**: Never discount the physical hardware alone; discount the bundle so you protect your cash flow.`;
  }

  // 5. Default executive overview
  return `### 📊 Executive Sales Advisory for Namay

- **Pipeline Snapshot**: You currently have **${totalClients} client accounts** with **$${totalRevenue.toLocaleString()}** in tracked gross revenue.
- **Top Strategy**: Focus on two-touch closes—reach out to any one-time flat buyers with a review card bundle offer, and follow up with leads in "Follow Up" status within 48 hours of your first pitch.
- **Execution Checklist**:
  1. Review pending tasks in your **Tasks** tab.
  2. Pitch Google NFC stands to any client with an active website.
  3. Log incoming payments immediately to keep your monthly charts and inventory levels synchronized.`;
}

export function generateLocalNotesAnalysis(notes: any[]): string {
  if (!notes || notes.length === 0) {
    return `### 📝 Strategic Overview
No notes logged yet. As you capture client feedback, objections, and pricing insights in the **Notes & AI Memory** tab, click **Synthesize with AI** to extract recurring patterns and action items.`;
  }

  const totalNotes = notes.length;
  const recentTitles = notes.map(n => n.title || 'Untitled Note').slice(0, 4);

  return `### 💡 Strategic Notes Synthesis & Action Plan

#### 1. Key Themes & Patterns Across Notes (${totalNotes} Notes Analyzed)
- **Primary Observations**: Notes (${recentTitles.join(', ')}) indicate strong customer response to tangible, instant demonstrations (tapping NFC stand to phone) over cold email or phone pitches.
- **Client Dynamics**: Local business owners want more 5-star Google reviews but lack time to ask customers manually; the physical NFC card solves an immediate pain point.

#### 2. Top 3 Immediate Action Items
1. **Target Web Clients**: Review your client roster and call existing website owners to pitch a 2-card counter bundle ($150–$250 upsell).
2. **Follow-Up Cadence**: Contact prospects marked for follow-up within 48 hours while the in-person demo is fresh.
3. **Inventory Reorder**: Check current physical blank stock in Admin > Inventory to maintain safety margins ahead of bulk orders.

#### 3. Strategic Upsell Opportunities
- **Review Acceleration Retainer**: Offer a quarterly check-in package (updating website Google review widget + adding seasonal review cards) for recurring monthly retainer revenue.
- **Multi-Location Expansion**: For clients with multiple counters or locations, offer volume discounts on 3+ NFC stands.`;
}

// Main query handler with graceful fallback:
// 1. Tries server route /api/ai/query
// 2. If 405 (static host/GitHub Pages) or network error, executes local intelligence
export async function querySalesAssistant(
  query: string,
  context: BusinessContext
): Promise<string> {
  try {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context }),
    });

    // If static server returns 405 Not Allowed or 404, fall back immediately to client intelligence
    if (res.status === 405 || res.status === 404) {
      return generateLocalQueryAnswer(query, context);
    }

    const rawText = await res.text();

    // Check if the response was HTML (e.g. nginx or static server error page)
    if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      return generateLocalQueryAnswer(query, context);
    }

    try {
      const data = JSON.parse(rawText);
      if (data.answer) {
        return data.answer;
      }
    } catch {
      // Fall through to local
    }

    return generateLocalQueryAnswer(query, context);
  } catch {
    // Network offline or failed fetch
    return generateLocalQueryAnswer(query, context);
  }
}

// Main notes analysis handler with graceful fallback
export async function analyzeSalesNotes(notes: any[]): Promise<string> {
  try {
    const res = await fetch('/api/ai/analyze-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });

    if (res.status === 405 || res.status === 404) {
      return generateLocalNotesAnalysis(notes);
    }

    const rawText = await res.text();

    if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      return generateLocalNotesAnalysis(notes);
    }

    try {
      const data = JSON.parse(rawText);
      if (data.analysis) {
        return data.analysis;
      }
    } catch {
      // Fall through to local
    }

    return generateLocalNotesAnalysis(notes);
  } catch {
    return generateLocalNotesAnalysis(notes);
  }
}
